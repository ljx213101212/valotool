import { DeleteOutlined } from '@ant-design/icons';
import { AgentMapTokenChip } from '@/features/agents/components/AgentMapTokenChip';
import { getAbilityDisplayName } from '@/features/abilities/abilityDisplayName';
import { getAgentLabel } from '@/shared/data/agentsCatalog';
import type { TimelineAbilityDeployEvent } from '@/shared/types/timelineAbility';
import type { MapAgentPlacement } from '@/shared/types/matchup';
import './AbilityDeployEventRow.less';

type AbilityDeployEventRowProps = {
  displayIndex: number;
  event: TimelineAbilityDeployEvent;
  owner: MapAgentPlacement | null;
  onDelete: () => void;
};

export function AbilityDeployEventRow({
  displayIndex,
  event,
  owner,
  onDelete,
}: AbilityDeployEventRowProps) {
  const abilityName = getAbilityDisplayName(event.agentId, event.abilitySlot);
  const casterName = owner ? getAgentLabel(owner.agentId) : getAgentLabel(event.agentId);
  const phaseLabel = event.phase === 'start' ? '开始' : '结束';

  return (
    <li className="ability-deploy-event-row">
      <span className="ability-deploy-event-row__idx" aria-hidden>
        {displayIndex}
      </span>
      <div className="ability-deploy-event-row__main">
        <div className="ability-deploy-event-row__name" title={abilityName}>
          {abilityName}
        </div>
        <div className="ability-deploy-event-row__meta">
          {owner ? (
            <AgentMapTokenChip
              agentId={owner.agentId}
              side={owner.side}
              eliminated={!!owner.eliminated}
              size={28}
              title={casterName}
            />
          ) : (
            <span className="ability-deploy-event-row__missing" title="未知施放者">
              ?
            </span>
          )}
          <span
            className={
              event.phase === 'start'
                ? 'ability-deploy-event-row__phase ability-deploy-event-row__phase--start'
                : 'ability-deploy-event-row__phase ability-deploy-event-row__phase--end'
            }
          >
            {phaseLabel}
          </span>
        </div>
      </div>
      <button
        type="button"
        className="ability-deploy-event-row__delete"
        onClick={onDelete}
        title="删除该技能"
        aria-label={`删除技能：${abilityName}`}
      >
        <DeleteOutlined aria-hidden />
      </button>
    </li>
  );
}
