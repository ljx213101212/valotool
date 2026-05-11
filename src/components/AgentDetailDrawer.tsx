import type { DrawerProps } from 'antd';
import { Drawer } from 'antd';
import { getAgentLabel } from '@/data/agentsCatalog';
import { useMatchupStore } from '@/store/useMatchupStore';
import './AgentDetailDrawer.less';

/** 与右侧战术面板、地图区一致的深蓝玻璃质感 */
const drawerStyles: NonNullable<DrawerProps['styles']> = {
  mask: {
    background: 'rgba(15, 23, 42, 0.78)',
    backdropFilter: 'blur(4px)',
  },
  wrapper: {
    boxShadow: '-18px 0 52px rgba(0, 0, 0, 0.58)',
  },
  section: {
    background: '#0f172a',
    borderLeft: '1px solid rgba(56, 189, 248, 0.16)',
  },
  header: {
    background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.55) 0%, rgba(15, 23, 42, 1) 100%)',
    borderBottom: '1px solid rgba(51, 65, 85, 0.88)',
    padding: '14px 18px',
    boxShadow: 'inset 0 -1px 0 rgba(56, 189, 248, 0.06)',
  },
  title: {
    color: '#e2e8f0',
  },
  body: {
    background: '#0f172a',
    padding: '18px 18px 24px',
  },
  close: {
    color: 'rgba(148, 163, 184, 0.95)',
  },
};

export function AgentDetailDrawer() {
  const selectedPlacementId = useMatchupStore((s) => s.selectedPlacementId);
  const setSelectedPlacementId = useMatchupStore((s) => s.setSelectedPlacementId);
  const mapPlacements = useMatchupStore((s) => s.mapPlacements);

  const placement = mapPlacements.find((p) => p.id === selectedPlacementId);
  const open = !!placement;

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
