import type { DrawerProps } from 'antd';
import { Drawer } from 'antd';
import { useEffect, useMemo } from 'react';
import { getAgentLabel } from '@/data/agentsCatalog';
import { getMapById } from '@/data/mapsCatalog';
import { TACTICAL_DRAWER_Z_INDEX, tacticalDrawerStyles } from '@/components/tacticalDrawerStyles';
import { useUiOverlayStore } from '@/store/uiOverlayStore';
import { useTimelineKeyframeStore } from '@/store/timelineKeyframeStore';
import { useTimelinePlaybackStore } from '@/store/timelinePlaybackStore';
import { formatTimelineQuantized } from '@/utils/timelineQuantize';
import './KeyframeDetailDrawer.less';

const drawerStyles = tacticalDrawerStyles satisfies NonNullable<DrawerProps['styles']>;

export function KeyframeDetailDrawer() {
  const maxTime = useTimelinePlaybackStore((s) => s.maxTime);
  const detailKeyframeId = useTimelineKeyframeStore((s) => s.detailKeyframeId);
  const keyframes = useTimelineKeyframeStore((s) => s.keyframes);
  const closeKeyframeDetail = useTimelineKeyframeStore((s) => s.closeKeyframeDetail);
  const pushDrawerLayer = useUiOverlayStore((s) => s.pushDrawerLayer);
  const popDrawerLayer = useUiOverlayStore((s) => s.popDrawerLayer);

  const entry = useMemo(
    () => keyframes.find((k) => k.id === detailKeyframeId),
    [keyframes, detailKeyframeId]
  );

  const open = !!entry;

  useEffect(() => {
    if (!open) return;
    pushDrawerLayer();
    return () => popDrawerLayer();
  }, [open, pushDrawerLayer, popDrawerLayer]);

  const snap = entry?.snapshot;

  return (
    <Drawer
      title={
        entry ? (
          <span className="keyframe-detail-drawer__title">
            <span className="keyframe-detail-drawer__label">关键帧</span>
            <span className="keyframe-detail-drawer__time">
              {formatTimelineQuantized(entry.time, maxTime)}
            </span>
          </span>
        ) : null
      }
      placement="right"
      open={open}
      onClose={closeKeyframeDetail}
      width={340}
      rootClassName="keyframe-detail-drawer"
      styles={drawerStyles}
      destroyOnClose
      zIndex={TACTICAL_DRAWER_Z_INDEX}
    >
      {snap ? (
        <div className="keyframe-detail-drawer__body">
          <dl className="keyframe-detail-drawer__list">
            <div className="keyframe-detail-drawer__row">
              <dt>地图</dt>
              <dd>{getMapById(snap.mapSelection.selectedMapId)?.label ?? snap.mapSelection.selectedMapId}</dd>
            </div>
            <div className="keyframe-detail-drawer__row">
              <dt>视角</dt>
              <dd>{snap.mapSelection.side === 'attack' ? '进攻' : '防守'}</dd>
            </div>
            <div className="keyframe-detail-drawer__row">
              <dt>拖入阵营偏好</dt>
              <dd>{snap.matchup.dragDropTargetSide === 'attack' ? '进攻' : '防守'}</dd>
            </div>
            <div className="keyframe-detail-drawer__row">
              <dt>阵容规模</dt>
              <dd>
                进攻 {snap.matchup.attackAgentIds.length} · 防守 {snap.matchup.defenseAgentIds.length}
              </dd>
            </div>
          </dl>

          <section className="keyframe-detail-drawer__section">
            <h3 className="keyframe-detail-drawer__section-title">进攻</h3>
            <ul className="keyframe-detail-drawer__agents">
              {snap.matchup.attackAgentIds.map((id) => (
                <li key={id}>{getAgentLabel(id)}</li>
              ))}
              {snap.matchup.attackAgentIds.length === 0 ? (
                <li className="keyframe-detail-drawer__empty">—</li>
              ) : null}
            </ul>
          </section>

          <section className="keyframe-detail-drawer__section">
            <h3 className="keyframe-detail-drawer__section-title">防守</h3>
            <ul className="keyframe-detail-drawer__agents">
              {snap.matchup.defenseAgentIds.map((id) => (
                <li key={id}>{getAgentLabel(id)}</li>
              ))}
              {snap.matchup.defenseAgentIds.length === 0 ? (
                <li className="keyframe-detail-drawer__empty">—</li>
              ) : null}
            </ul>
          </section>

          <section className="keyframe-detail-drawer__section">
            <h3 className="keyframe-detail-drawer__section-title">地图落位（{snap.matchup.mapPlacements.length}）</h3>
            <ul className="keyframe-detail-drawer__placements">
              {snap.matchup.mapPlacements.map((p) => (
                <li key={p.id}>
                  <span
                    className={
                      p.side === 'attack'
                        ? 'keyframe-detail-drawer__side-tag keyframe-detail-drawer__side-tag--attack'
                        : 'keyframe-detail-drawer__side-tag keyframe-detail-drawer__side-tag--defense'
                    }
                  >
                    {p.side === 'attack' ? '攻' : '守'}
                  </span>
                  {getAgentLabel(p.agentId)} · ({p.x.toFixed(0)}, {p.y.toFixed(0)}) · 朝向{' '}
                  {((p.facing * 180) / Math.PI).toFixed(0)}°
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </Drawer>
  );
}
