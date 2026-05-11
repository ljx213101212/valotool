import type { DrawerProps } from 'antd';
import { Drawer } from 'antd';
import { useEffect } from 'react';
import { getAgentLabel } from '@/data/agentsCatalog';
import { useUiOverlayStore } from '@/store/uiOverlayStore';
import { useMatchupStore } from '@/store/useMatchupStore';
import { TACTICAL_DRAWER_Z_INDEX, tacticalDrawerStyles } from '@/components/tacticalDrawerStyles';
import './AgentDetailDrawer.less';

const drawerStyles = tacticalDrawerStyles satisfies NonNullable<DrawerProps['styles']>;

export function AgentDetailDrawer() {
  const selectedPlacementId = useMatchupStore((s) => s.selectedPlacementId);
  const setSelectedPlacementId = useMatchupStore((s) => s.setSelectedPlacementId);
  const mapPlacements = useMatchupStore((s) => s.mapPlacements);
  const pushDrawerLayer = useUiOverlayStore((s) => s.pushDrawerLayer);
  const popDrawerLayer = useUiOverlayStore((s) => s.popDrawerLayer);

  const placement = mapPlacements.find((p) => p.id === selectedPlacementId);
  const open = !!placement;

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
      ) : null}
    </Drawer>
  );
}
