import { useEffect, useMemo, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Line, Text, Group, RegularPolygon } from 'react-konva';
import { getCalibration, gameToPixel, viewDirToPixel, rotationDegrees } from './mapCalibration';
import type { MapCalibration } from './mapCalibration';
import { agentSlugFromUuid } from './agentUuidMap';
import { deriveRoundMoments, formatRoundTime } from './deriveMoments';
import type { MatchDetails, MatchPlayer, ReplayMoment } from './types';
import type { MatchSource, MatchSummary } from './data/matchSource';
import { defaultMatchSource } from './data/sampleFileSource';

const SIZE = 720;

const TEAM_COLOR: Record<string, string> = { Blue: '#3b82f6', Red: '#ef4444' };
function teamColor(teamId: string): string {
  return TEAM_COLOR[teamId] ?? '#a3a3a3';
}

/** 加载 HTMLImageElement 的小 hook。 */
function useHtmlImage(src: string | undefined): HTMLImageElement | undefined {
  const [img, setImg] = useState<HTMLImageElement>();
  useEffect(() => {
    if (!src) return;
    const el = new window.Image();
    el.src = src;
    el.onload = () => setImg(el);
    return () => {
      el.onload = null;
    };
  }, [src]);
  return img;
}

export function MatchReplayPoc({ source = defaultMatchSource }: { source?: MatchSource } = {}) {
  const [summaries, setSummaries] = useState<MatchSummary[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>();
  const [match, setMatch] = useState<MatchDetails>();
  const [error, setError] = useState<string>();
  const [roundNum, setRoundNum] = useState(0);
  const [momentIdx, setMomentIdx] = useState(0);

  // 列出可复盘对局（数据来源经 MatchSource 抽象，样例/官方/本地可替换）
  useEffect(() => {
    let alive = true;
    source
      .listMatches()
      .then((list) => {
        if (!alive) return;
        setSummaries(list);
        setSelectedMatchId(list[0]?.matchId);
      })
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [source]);

  // 按选中的 matchId 取完整对局
  useEffect(() => {
    if (!selectedMatchId) return;
    let alive = true;
    source
      .getMatch(selectedMatchId)
      .then((d) => alive && setMatch(d))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [source, selectedMatchId]);

  const selectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
    setMatch(undefined);
    setRoundNum(0);
    setMomentIdx(0);
  };

  const cal = match ? getCalibration(match.matchInfo.mapId) : undefined;
  const minimap = useHtmlImage(cal?.displayIcon);

  const playerById = useMemo(() => {
    const m = new Map<string, MatchPlayer>();
    match?.players.forEach((p) => m.set(p.subject, p));
    return m;
  }, [match]);

  const moments = useMemo<ReplayMoment[]>(
    () => (match ? deriveRoundMoments(match, roundNum) : []),
    [match, roundNum],
  );

  const selectRound = (n: number) => {
    setRoundNum(n);
    setMomentIdx(0);
  };

  if (error) return <Centered>加载失败：{error}</Centered>;
  if (!match) return <Centered>加载对局中…（来源：{source.label}）</Centered>;
  if (!cal) return <Centered>缺少该地图标定：{match.matchInfo.mapId}</Centered>;

  const rounds = match.roundResults ?? [];
  const round = rounds.find((r) => r.roundNum === roundNum);
  const moment = moments[Math.min(momentIdx, moments.length - 1)];

  const nameOf = (subject?: string) => {
    if (!subject) return '—';
    const p = playerById.get(subject);
    return p ? `${p.gameName}#${p.tagLine}` : subject.slice(0, 8);
  };
  const shortName = (p: MatchPlayer) => {
    const slug = agentSlugFromUuid(p.characterId);
    if (slug) return slug.slice(0, 3).toUpperCase();
    // 脱敏 fixture 无 agent → 用玩家名尾号
    const m = p.gameName.match(/(\d+)\s*$/);
    return m ? m[1].slice(-2) : p.gameName.slice(0, 2);
  };

  return (
    <div style={styles.root}>
      <aside style={styles.sidebar}>
        <h2 style={styles.h2}>关键帧战术复盘 · PoC</h2>
        <label style={styles.sourceRow}>
          <span style={styles.sourceLabel}>对局来源 · {source.label}</span>
          <select
            style={styles.matchSelect}
            value={selectedMatchId ?? ''}
            onChange={(e) => selectMatch(e.target.value)}
          >
            {summaries.map((s) => (
              <option key={s.matchId} value={s.matchId}>
                {(s.mapDisplayName ?? s.mapId)} · {s.isRanked ? '竞技' : s.queueId}
              </option>
            ))}
          </select>
        </label>
        <div style={styles.meta}>
          {cal.displayName} · {match.matchInfo.isRanked ? '竞技' : match.matchInfo.queueID} ·{' '}
          {match.players.length} 人 · {rounds.length} 回合
        </div>
        <div style={styles.note}>
          数据为真实对局坐标（脱敏样例，玩家名/英雄已打码）。每帧 = Riot 在击杀/下包/拆包瞬间记录的全员位置快照。
        </div>

        <Section title={`回合 ${roundNum + 1} / ${rounds.length}`}>
          <div style={styles.roundGrid}>
            {rounds.map((r) => (
              <button
                key={r.roundNum}
                onClick={() => selectRound(r.roundNum)}
                style={{
                  ...styles.roundBtn,
                  ...(r.roundNum === roundNum ? styles.roundBtnActive : {}),
                  borderColor: teamColor(r.winningTeam),
                }}
              >
                {r.roundNum + 1}
              </button>
            ))}
          </div>
          {round && (
            <div style={styles.roundInfo}>
              结果：{round.roundResult} · 胜方{' '}
              <span style={{ color: teamColor(round.winningTeam) }}>{round.winningTeam}</span>
              {round.plantSite ? ` · 下包点 ${round.plantSite}` : ''}
            </div>
          )}
        </Section>

        <Section title={`关键时刻 (${moments.length})`}>
          <div style={styles.momentList}>
            {moments.map((mm, i) => (
              <button
                key={i}
                onClick={() => setMomentIdx(i)}
                style={{ ...styles.momentBtn, ...(i === momentIdx ? styles.momentBtnActive : {}) }}
              >
                <span style={styles.momentTag(mm.type)}>{momentLabel(mm.type)}</span>
                <span>{formatRoundTime(mm.roundTime)}</span>
                {mm.type === 'kill' && mm.kill && (
                  <span style={styles.momentSub}>
                    {nameOf(mm.kill.killer)} ▸ {nameOf(mm.kill.victim)}
                  </span>
                )}
                {mm.type === 'plant' && <span style={styles.momentSub}>{nameOf(mm.actor)} 安放</span>}
                {mm.type === 'defuse' && <span style={styles.momentSub}>拆除</span>}
              </button>
            ))}
            {moments.length === 0 && <div style={styles.note}>本回合无关键时刻数据</div>}
          </div>
          <div style={styles.scrubRow}>
            <button style={styles.navBtn} onClick={() => setMomentIdx((i) => Math.max(0, i - 1))}>
              ◀ 上一帧
            </button>
            <button
              style={styles.navBtn}
              onClick={() => setMomentIdx((i) => Math.min(moments.length - 1, i + 1))}
            >
              下一帧 ▶
            </button>
          </div>
        </Section>
      </aside>

      <main style={styles.canvasWrap}>
        <Stage width={SIZE} height={SIZE}>
          <Layer listening={false}>
            {minimap && (
              <KonvaImage
                image={minimap}
                width={SIZE}
                height={SIZE}
                opacity={0.9}
                offsetX={SIZE / 2}
                offsetY={SIZE / 2}
                x={SIZE / 2}
                y={SIZE / 2}
                rotation={rotationDegrees(cal)}
              />
            )}
          </Layer>
          <Layer listening={false}>
            {moment && (
              <MomentLayer moment={moment} cal={cal} playerById={playerById} shortName={shortName} />
            )}
          </Layer>
        </Stage>
        {moment && (
          <div style={styles.canvasCaption}>
            R{roundNum + 1} · {momentLabel(moment.type)} @ {formatRoundTime(moment.roundTime)}
            {moment.type === 'kill' && moment.kill
              ? ` · ${nameOf(moment.kill.killer)} 击杀 ${nameOf(moment.kill.victim)}`
              : ''}
          </div>
        )}
      </main>
    </div>
  );
}

function MomentLayer({
  moment,
  cal: calibration,
  playerById,
  shortName,
}: {
  moment: ReplayMoment;
  cal: MapCalibration;
  playerById: Map<string, MatchPlayer>;
  shortName: (p: MatchPlayer) => string;
}) {
  const killer = moment.kill?.killer;
  const killerLoc = moment.locations.find((l) => l.subject === killer);

  return (
    <Group>
      {/* 击杀连线：击杀者 → 死者 */}
      {moment.kill && killerLoc && (
        (() => {
          const a = gameToPixel(killerLoc.location, calibration, SIZE);
          const b = gameToPixel(moment.kill!.victimLocation, calibration, SIZE);
          return <Line points={[a.x, a.y, b.x, b.y]} stroke="#fbbf24" strokeWidth={2} dash={[6, 4]} />;
        })()
      )}

      {/* 死者标记 */}
      {moment.kill && (() => {
        const v = playerById.get(moment.kill.victim);
        const p = gameToPixel(moment.kill.victimLocation, calibration, SIZE);
        const col = teamColor(v?.teamId ?? '');
        return (
          <Group x={p.x} y={p.y}>
            <Line points={[-6, -6, 6, 6]} stroke={col} strokeWidth={3} />
            <Line points={[-6, 6, 6, -6]} stroke={col} strokeWidth={3} />
          </Group>
        );
      })()}

      {/* 装置标记（下包/拆包） */}
      {moment.spikeLocation && (() => {
        const p = gameToPixel(moment.spikeLocation, calibration, SIZE);
        return (
          <Group x={p.x} y={p.y}>
            <RegularPolygon sides={4} radius={9} fill="#facc15" stroke="#000" strokeWidth={1} rotation={45} />
          </Group>
        );
      })()}

      {/* 存活玩家 token + 朝向 */}
      {moment.locations.map((loc) => {
        const p = playerById.get(loc.subject);
        const col = teamColor(p?.teamId ?? '');
        const pos = gameToPixel(loc.location, calibration, SIZE);
        const dir = viewDirToPixel(loc.viewRadians, calibration);
        const isKiller = loc.subject === killer;
        return (
          <Group key={loc.subject} x={pos.x} y={pos.y}>
            <Line points={[0, 0, dir.x * 22, dir.y * 22]} stroke={col} strokeWidth={2} opacity={0.8} />
            <Circle radius={11} fill={col} stroke={isKiller ? '#fbbf24' : '#0b0b0b'} strokeWidth={isKiller ? 3 : 1.5} />
            {p && (
              <Text
                text={shortName(p)}
                fontSize={10}
                fontStyle="bold"
                fill="#fff"
                width={30}
                align="center"
                offsetX={15}
                offsetY={5}
              />
            )}
          </Group>
        );
      })}
    </Group>
  );
}

function momentLabel(t: ReplayMoment['type']): string {
  return t === 'kill' ? '击杀' : t === 'plant' ? '下包' : '拆包';
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div style={{ ...styles.root, ...styles.centered }}>{children}</div>;
}

type CSS = React.CSSProperties;
const styles = {
  root: { display: 'flex', gap: 16, padding: 16, height: '100vh', boxSizing: 'border-box', background: '#0e1116', color: '#e5e7eb', fontFamily: 'system-ui, sans-serif' } as CSS,
  centered: { alignItems: 'center', justifyContent: 'center', fontSize: 16 } as CSS,
  sidebar: { width: 320, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 } as CSS,
  h2: { margin: 0, fontSize: 18 } as CSS,
  sourceRow: { display: 'flex', flexDirection: 'column', gap: 4 } as CSS,
  sourceLabel: { fontSize: 12, color: '#9ca3af' } as CSS,
  matchSelect: { padding: '6px 8px', fontSize: 13, background: '#111827', color: '#e5e7eb', border: '1px solid #374151', borderRadius: 4 } as CSS,
  meta: { fontSize: 13, color: '#9ca3af' } as CSS,
  note: { fontSize: 12, color: '#6b7280', lineHeight: 1.5 } as CSS,
  section: { border: '1px solid #1f2937', borderRadius: 8, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 } as CSS,
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#cbd5e1' } as CSS,
  roundGrid: { display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 4 } as CSS,
  roundBtn: { padding: '4px 0', fontSize: 11, background: '#111827', color: '#e5e7eb', border: '1.5px solid #374151', borderRadius: 4, cursor: 'pointer' } as CSS,
  roundBtnActive: { background: '#1f2937', fontWeight: 700, outline: '2px solid #e5e7eb' } as CSS,
  roundInfo: { fontSize: 12, color: '#9ca3af' } as CSS,
  momentList: { display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto' } as CSS,
  momentBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', fontSize: 12, background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 4, cursor: 'pointer', textAlign: 'left' } as CSS,
  momentBtnActive: { background: '#1f2937', outline: '1px solid #60a5fa' } as CSS,
  momentSub: { color: '#9ca3af', marginLeft: 'auto', fontSize: 11 } as CSS,
  momentTag: (t: ReplayMoment['type']): CSS => ({ fontWeight: 700, color: t === 'kill' ? '#fbbf24' : t === 'plant' ? '#f87171' : '#34d399', minWidth: 28 }),
  scrubRow: { display: 'flex', gap: 8 } as CSS,
  navBtn: { flex: 1, padding: '6px 0', fontSize: 12, background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', borderRadius: 4, cursor: 'pointer' } as CSS,
  canvasWrap: { position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 } as CSS,
  canvasCaption: { position: 'absolute', left: 8, bottom: 8, padding: '4px 10px', fontSize: 12, background: 'rgba(0,0,0,0.6)', borderRadius: 4 } as CSS,
} satisfies Record<string, CSS | ((t: ReplayMoment['type']) => CSS)>;

export default MatchReplayPoc;
