import type { DrawerProps } from 'antd';
import { Drawer } from 'antd';
import { useCallback, useEffect, useMemo } from 'react';
import { getAgentLabel } from '@/data/agentsCatalog';
import { useUiOverlayStore } from '@/store/uiOverlayStore';
import { useMatchupStore } from '@/store/useMatchupStore';
import { useTimelineKeyframeStore } from '@/store/timelineKeyframeStore';
import { TACTICAL_DRAWER_Z_INDEX, tacticalDrawerStyles } from '@/components/tacticalDrawerStyles';
import './AgentDetailDrawer.less';

const drawerStyles = tacticalDrawerStyles satisfies NonNullable<DrawerProps['styles']>;

export function AgentDetailDrawer() {
  const selectedPlacementId = useMatchupStore((s) => s.selectedPlacementId);
  const setSelectedPlacementId = useMatchupStore((s) => s.setSelectedPlacementId);
  const mapPlacements = useMatchupStore((s) => s.mapPlacements);
  const pushDrawerLayer = useUiOverlayStore((s) => s.pushDrawerLayer);
  const popDrawerLayer = useUiOverlayStore((s) => s.popDrawerLayer);
  const recordKillAtPlayhead = useTimelineKeyframeStore((s) => s.recordKillAtPlayhead);

  const placement = mapPlacements.find((p) => p.id === selectedPlacementId);
  const open = !!placement;

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

  useEffect(() => {
    if (!open) return;
    pushDrawerLayer();
    return () => popDrawerLayer();
  }, [open, pushDrawerLayer, popDrawerLayer]);

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
      onClose={() => setSelectedPlacementId(null)}
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

          <section className="agent-detail-drawer__kills" aria-labelledby="agent-kills-label">
            <h2 id="agent-kills-label" className="agent-detail-drawer__kills-title">
              击杀记录
            </h2>
            <p className="agent-detail-drawer__kills-hint">
              记录在当前时间轴刻度（100ms）的关键帧中；同一刻度内多次击杀按顺序保存，用于首杀等逻辑。
            </p>
            {placement.eliminated ? (
              <p className="agent-detail-drawer__kills-muted">该特工已淘汰，无法继续记录击杀。</p>
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
