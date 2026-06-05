import { useMemo, useState } from 'react';
import { Switch } from 'antd';
import { useDraggable } from '@dnd-kit/core';
import {
  ROLE_FILTER_LABELS,
  filterAgentsByRole,
  getAgentLabel,
  type AgentCatalogEntry,
  type RoleFilter,
} from '@/shared/data/agentsCatalog';
import { getAgentPortraitUrl } from '@/shared/data/agentPortraitUrl';
import { useMatchupStore } from '@/shared/store/useMatchupStore';

const ROLE_ORDER = ['duelist', 'initiator', 'sentinel', 'controller'] as const;

function DraggableHeroChip({ agent }: { agent: AgentCatalogEntry }) {
  const portraitUrl = getAgentPortraitUrl(agent.id);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-agent-${agent.id}`,
    data: { type: 'palette-agent', agentId: agent.id },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.35 : 1,
      }
    : { opacity: isDragging ? 0.35 : 1 };

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      className="right-hero-chip"
      title={agent.label}
      aria-label={agent.label}
      {...listeners}
      {...attributes}
    >
      {portraitUrl ? (
        <img className="right-hero-chip__portrait" src={portraitUrl} alt="" draggable={false} />
      ) : (
        <span className="right-hero-chip__fallback">{agent.label}</span>
      )}
    </button>
  );
}

export function RightHeroesPicker() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const attackAgentIds = useMatchupStore((s) => s.attackAgentIds);
  const defenseAgentIds = useMatchupStore((s) => s.defenseAgentIds);
  const dragDropTargetSide = useMatchupStore((s) => s.dragDropTargetSide);
  const setDragDropTargetSide = useMatchupStore((s) => s.setDragDropTargetSide);

  const filteredAgents = useMemo(() => filterAgentsByRole(roleFilter), [roleFilter]);

  return (
    <div className="right-heroes-picker">
      <div className="right-heroes-picker__filters" role="group" aria-label="按职位筛选">
        <button
          type="button"
          className={`right-hero-filter-btn${roleFilter === 'all' ? ' right-hero-filter-btn--active' : ''}`}
          onClick={() => setRoleFilter('all')}
        >
          全部
        </button>
        {ROLE_ORDER.map((role) => (
          <button
            key={role}
            type="button"
            className={`right-hero-filter-btn${roleFilter === role ? ' right-hero-filter-btn--active' : ''}`}
            onClick={() => setRoleFilter(role)}
          >
            {ROLE_FILTER_LABELS[role]}
          </button>
        ))}
      </div>

      <div className="right-heroes-picker__drop-target-row">
        <span className="right-heroes-picker__drop-label">拖入地图加入</span>
        <Switch
          className="right-heroes-picker__side-switch"
          checked={dragDropTargetSide === 'defense'}
          onChange={(checked) => setDragDropTargetSide(checked ? 'defense' : 'attack')}
          checkedChildren="守方"
          unCheckedChildren="攻方"
        />
      </div>

      <p className="right-heroes-picker__hint">按住英雄拖到中间地图即可加入对应阵营</p>

      <div className="right-heroes-picker__grid">
        {filteredAgents.map((agent) => (
          <DraggableHeroChip key={agent.id} agent={agent} />
        ))}
      </div>

      <div className="right-heroes-picker__roster">
        <section className="right-heroes-picker__roster-block">
          <h3 className="right-heroes-picker__roster-title right-heroes-picker__roster-title--attack">攻方阵容</h3>
          {attackAgentIds.length === 0 ? (
            <p className="right-heroes-picker__roster-empty">暂无</p>
          ) : (
            <ul className="right-heroes-picker__roster-list">
              {attackAgentIds.map((id) => (
                <li key={id}>{getAgentLabel(id)}</li>
              ))}
            </ul>
          )}
        </section>
        <section className="right-heroes-picker__roster-block">
          <h3 className="right-heroes-picker__roster-title right-heroes-picker__roster-title--defense">守方阵容</h3>
          {defenseAgentIds.length === 0 ? (
            <p className="right-heroes-picker__roster-empty">暂无</p>
          ) : (
            <ul className="right-heroes-picker__roster-list">
              {defenseAgentIds.map((id) => (
                <li key={id}>{getAgentLabel(id)}</li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
