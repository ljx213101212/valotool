import type { DrawerProps } from 'antd';
import { Drawer } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AgentBuyLoadoutModal } from '@/features/agents/components/AgentBuyLoadoutModal';
import { KillEventRow } from '@/features/tactical-panels/components/KillEventRow';
import { getAgentLabel } from '@/shared/data/agentsCatalog';
import { useUiOverlayStore } from '@/shared/store/uiOverlayStore';
import { useMatchupStore } from '@/shared/store/useMatchupStore';
import { useTimelineKeyframeStore } from '@/shared/store/timelineKeyframeStore';
import { useTimelinePlaybackStore } from '@/shared/store/timelinePlaybackStore';
import { TACTICAL_DRAWER_Z_INDEX, tacticalDrawerStyles } from '@/features/tactical-panels/components/tacticalDrawerStyles';
import { collectAgentKillFeed } from '@/shared/utils/agentKillFeed';
import { formatTimelineQuantized } from '@/shared/utils/timelineQuantize';
import './AgentDetailDrawer.less';

const drawerStyles = tacticalDrawerStyles satisfies NonNullable<DrawerProps['styles']>;

export function AgentDetailDrawer() {
  const selectedPlacementId = useMatchupStore((s) => s.selectedPlacementId);
  const setSelectedPlacementId = useMatchupStore((s) => s.setSelectedPlacementId);
  const mapPlacements = useMatchupStore((s) => s.mapPlacements);
  const pushDrawerLayer = useUiOverlayStore((s) => s.pushDrawerLayer);
  const popDrawerLayer = useUiOverlayStore((s) => s.popDrawerLayer);
  const recordKillAtPlayhead = useTimelineKeyframeStore((s) => s.recordKillAtPlayhead);
  const keyframes = useTimelineKeyframeStore((s) => s.keyframes);
  const seek = useTimelinePlaybackStore((s) => s.seek);
  const pausePlayback = useTimelinePlaybackStore((s) => s.pausePlayback);
  const maxTime = useTimelinePlaybackStore((s) => s.maxTime);

  const [buyLoadoutOpen, setBuyLoadoutOpen] = useState(false);

  const placement = mapPlacements.find((p) => p.id === selectedPlacementId);
  const open = !!placement;

  const killFeed = useMemo(
    () => (placement ? collectAgentKillFeed(placement, keyframes) : []),
    [placement, keyframes]
  );

  const livingEnemies = useMemo(() => {
    if (!placement) return [];
    return mapPlacements.filter(
      (p) => p.side !== placement.side && !p.eliminated && p.id !== placement.id
    );
  }, [mapPlacements, placement]);

  const onRecordKill = useCallback(
    (killerId: string, victimId: string) => {
      recordKillAtPlayhead(killerId, victimId);
    },
    [recordKillAtPlayhead]
  );

  const jumpToKeyframe = useCallback(
    (time: number) => {
      pausePlayback();
      seek(time);
    },
    [pausePlayback, seek]
  );

  useEffect(() => {
    if (!open) return;
    pushDrawerLayer();
    return () => popDrawerLayer();
  }, [open, pushDrawerLayer, popDrawerLayer]);

  const closeDrawer = useCallback(() => {
    setBuyLoadoutOpen(false);
    setSelectedPlacementId(null);
  }, [setSelectedPlacementId]);

  return (
    <Drawer
      title={
        placement ? (
          <span className="agent-detail-drawer__title">
            <span className="agent-detail-drawer__name">{getAgentLabel(placement.agentId)}</span>
            <span
              className={
                placement.side === 'attack'
                  ? 'agent-detail-drawer__side agent-detail-drawer__side--attack'
                  : 'agent-detail-drawer__side agent-detail-drawer__side--defense'
              }
            >
              {placement.side === 'attack' ? '进攻' : '防守'}
            </span>
          </span>
        ) : null
      }
      placement="right"
      open={open}
      onClose={closeDrawer}
      width={320}
      rootClassName="agent-detail-drawer"
      styles={drawerStyles}
      destroyOnClose
      zIndex={TACTICAL_DRAWER_Z_INDEX}
    >
      {placement ? (
        <>
          <dl className="agent-detail-drawer__list">
            <div className="agent-detail-drawer__row">
              <dt>当前坐标</dt>
              <dd>
                ({placement.x.toFixed(1)}, {placement.y.toFixed(1)})
              </dd>
            </div>
            <div className="agent-detail-drawer__row">
              <dt>当前血量</dt>
              <dd className="agent-detail-drawer__placeholder">—</dd>
            </div>
            <div className="agent-detail-drawer__row">
              <dt>当前经济</dt>
              <dd className="agent-detail-drawer__placeholder">—</dd>
            </div>
            <div className="agent-detail-drawer__row">
              <dt>当前配枪</dt>
              <dd className="agent-detail-drawer__placeholder">—</dd>
            </div>
            <div className="agent-detail-drawer__row">
              <dt>技能状态</dt>
              <dd className="agent-detail-drawer__placeholder">—</dd>
            </div>
          </dl>

          <div className="agent-detail-drawer__buy-wrap">
            <button
              type="button"
              className="agent-detail-drawer__buy-btn"
              onClick={() => setBuyLoadoutOpen(true)}
            >
              购买装备
            </button>
          </div>

          <AgentBuyLoadoutModal
            open={buyLoadoutOpen}
            onClose={() => setBuyLoadoutOpen(false)}
            agentCatalogId={placement.agentId}
          />

          <section className="agent-detail-drawer__kills" aria-labelledby="agent-kills-label">
            <h2 id="agent-kills-label" className="agent-detail-drawer__kills-title">
              击杀记录
            </h2>
            <p className="agent-detail-drawer__kills-hint">
              新建击杀写入当前播放头所在关键帧；下方为全时间轴中与该特工相关的击杀事件，点击可跳转。
            </p>

            <h3 className="agent-detail-drawer__kill-feed-heading">时间轴履历</h3>
            {killFeed.length === 0 ? (
              <p className="agent-detail-drawer__kills-muted">暂无关键帧击杀记录。</p>
            ) : (
              <ul className="agent-detail-drawer__kill-feed-list" role="list">
                {killFeed.map((entry, i) => {
                  const kLabel = getAgentLabel(entry.killer.agentId);
                  const vLabel = getAgentLabel(entry.victim.agentId);
                  const rowLabel = `${kLabel} 击杀 ${vLabel}`;
                  const timeStr = formatTimelineQuantized(entry.keyframeTime, maxTime);
                  return (
                    <KillEventRow
                      key={`${entry.keyframeId}-${entry.indexInKeyframe}-${entry.role}`}
                      displayIndex={i + 1}
                      killer={entry.killer}
                      victim={entry.victim}
                      onClick={() => jumpToKeyframe(entry.keyframeTime)}
                      ariaJumpLabel={`跳转到 ${timeStr}：${rowLabel}`}
                      trailing={
                        <div className="agent-detail-drawer__kill-feed-meta">
                          <span className="agent-detail-drawer__kill-feed-time">{timeStr}</span>
                          <span
                            className={
                              entry.role === 'dealt'
                                ? 'agent-detail-drawer__kill-feed-tag agent-detail-drawer__kill-feed-tag--dealt'
                                : 'agent-detail-drawer__kill-feed-tag agent-detail-drawer__kill-feed-tag--received'
                            }
                          >
                            {entry.role === 'dealt' ? '主动出击' : '被淘汰'}
                          </span>
                        </div>
                      }
                    />
                  );
                })}
              </ul>
            )}

            {placement.eliminated ? (
              <p className="agent-detail-drawer__kills-muted agent-detail-drawer__kills-muted--spaced">
                该特工已淘汰，无法继续记录新的击杀。
              </p>
            ) : (
              <>
                <div className="agent-detail-drawer__kill-block">
                  <h3 className="agent-detail-drawer__kill-block-title">主动出击</h3>
                  {livingEnemies.length === 0 ? (
                    <p className="agent-detail-drawer__kills-muted">暂无存活敌方单位。</p>
                  ) : (
                    <ul className="agent-detail-drawer__kill-targets">
                      {livingEnemies.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            className="agent-detail-drawer__kill-btn"
                            onClick={() => onRecordKill(placement.id, p.id)}
                          >
                            <span
                              className={
                                p.side === 'attack'
                                  ? 'agent-detail-drawer__kill-side agent-detail-drawer__kill-side--attack'
                                  : 'agent-detail-drawer__kill-side agent-detail-drawer__kill-side--defense'
                              }
                            >
                              {p.side === 'attack' ? '攻' : '守'}
                            </span>
                            击杀 {getAgentLabel(p.agentId)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="agent-detail-drawer__kill-block">
                  <h3 className="agent-detail-drawer__kill-block-title">被击杀</h3>
                  {livingEnemies.length === 0 ? (
                    <p className="agent-detail-drawer__kills-muted">暂无存活敌方单位。</p>
                  ) : (
                    <ul className="agent-detail-drawer__kill-targets">
                      {livingEnemies.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            className="agent-detail-drawer__kill-btn"
                            onClick={() => onRecordKill(p.id, placement.id)}
                          >
                            <span
                              className={
                                p.side === 'attack'
                                  ? 'agent-detail-drawer__kill-side agent-detail-drawer__kill-side--attack'
                                  : 'agent-detail-drawer__kill-side agent-detail-drawer__kill-side--defense'
                              }
                            >
                              {p.side === 'attack' ? '攻' : '守'}
                            </span>
                            被 {getAgentLabel(p.agentId)} 击杀
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </section>
        </>
      ) : null}
    </Drawer>
  );
}
