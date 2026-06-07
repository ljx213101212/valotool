import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { MatchSource, MatchSummary } from './data/matchSource';
import { defaultMatchSource } from './data/sampleFileSource';

function formatDate(ms: number): string {
  if (!ms) return '';
  const d = new Date(ms);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 对局列表页：从 MatchSource 列出可复盘对局，点击进入单局复盘。 */
export function MatchListPage({ source = defaultMatchSource }: { source?: MatchSource } = {}) {
  const [summaries, setSummaries] = useState<MatchSummary[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let alive = true;
    source
      .listMatches()
      .then((list) => alive && setSummaries(list))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [source]);

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <Link to="/" style={styles.backLink}>
          ← 战术板
        </Link>
        <h1 style={styles.h1}>对局复盘</h1>
        <span style={styles.sourceTag}>来源 · {source.label}</span>
      </header>

      {error && <div style={styles.note}>加载失败：{error}</div>}
      {!error && !summaries && <div style={styles.note}>加载对局列表中…</div>}
      {summaries && summaries.length === 0 && <div style={styles.note}>暂无可复盘对局。</div>}

      <div style={styles.grid}>
        {summaries?.map((s) => (
          <Link key={s.matchId} to={`/replay/${s.matchId}`} style={styles.card}>
            <div style={styles.cardMap}>{s.mapDisplayName ?? s.mapId ?? '对局'}</div>
            <div style={styles.cardMeta}>
              <span style={s.isRanked ? styles.ranked : styles.casual}>
                {s.isRanked ? '竞技' : s.queueId || '对局'}
              </span>
              {formatDate(s.gameStartMillis) && <span>{formatDate(s.gameStartMillis)}</span>}
            </div>
            <div style={styles.cardGo}>查看复盘 →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

type CSS = React.CSSProperties;
const styles = {
  root: { minHeight: '100vh', boxSizing: 'border-box', padding: 24, background: '#0e1116', color: '#e5e7eb', fontFamily: 'system-ui, sans-serif' } as CSS,
  header: { display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 20 } as CSS,
  backLink: { fontSize: 13, color: '#93c5fd', textDecoration: 'none' } as CSS,
  h1: { margin: 0, fontSize: 22 } as CSS,
  sourceTag: { fontSize: 12, color: '#6b7280' } as CSS,
  note: { fontSize: 14, color: '#9ca3af' } as CSS,
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 } as CSS,
  card: { display: 'flex', flexDirection: 'column', gap: 10, padding: 16, background: '#111827', border: '1px solid #1f2937', borderRadius: 10, color: '#e5e7eb', textDecoration: 'none' } as CSS,
  cardMap: { fontSize: 17, fontWeight: 700 } as CSS,
  cardMeta: { display: 'flex', gap: 10, fontSize: 12, color: '#9ca3af' } as CSS,
  ranked: { color: '#fbbf24', fontWeight: 600 } as CSS,
  casual: { color: '#9ca3af' } as CSS,
  cardGo: { fontSize: 12, color: '#60a5fa', marginTop: 2 } as CSS,
} satisfies Record<string, CSS>;

export default MatchListPage;
