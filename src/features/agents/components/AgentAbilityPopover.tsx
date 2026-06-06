import { useMemo, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import {
  ABILITIES_BY_AGENT,
  DEPLOY_ABILITY_ROW,
  agentCatalogIdToAbilitySlug,
  type AbilitySlot,
  type AgentAbilityEntry,
} from '@/features/abilities';
import { getAbilityDisplayIconUrl } from '@/features/abilities/abilityDisplayIconUrls';
import { useMatchupStore } from '@/shared/store/useMatchupStore';
import type { AbilityPopoverAnchor } from '@/shared/types/ability';
import type { MapAgentPlacement } from '@/shared/types/matchup';
import './AgentAbilityPopover.less';

const POPOVER_OFFSET_X = 12;
const POPOVER_OFFSET_Y = 8;

type DeploySlotView = {
  keyLabel: string;
  slot: AbilitySlot;
  clickable: boolean;
  ability: AgentAbilityEntry | null;
  armed: boolean;
};

function buildDeploySlots(agentCatalogId: string, armedSlots: Set<AbilitySlot>): DeploySlotView[] {
  const slug = agentCatalogIdToAbilitySlug(agentCatalogId);
  const rows = ABILITIES_BY_AGENT[slug];
  const bySlot = new Map<AbilitySlot, AgentAbilityEntry>(rows.map((r) => [r.name, r]));
  return DEPLOY_ABILITY_ROW.map((row) => ({
    keyLabel: row.keyLabel,
    slot: row.slot,
    clickable: row.draggable,
    ability: bySlot.get(row.slot) ?? null,
    armed: armedSlots.has(row.slot),
  }));
}

function AbilityChip({
  slotView,
  onDeploy,
}: {
  slotView: DeploySlotView;
  onDeploy: (slot: AbilitySlot) => void;
}) {
  const disabled = !slotView.clickable || !slotView.ability;
  const iconSrc = slotView.ability
    ? getAbilityDisplayIconUrl(slotView.ability.displayIcon)
    : undefined;

  return (
    <button
      type="button"
      className={
        slotView.armed
          ? 'agent-ability-popover__chip agent-ability-popover__chip--armed'
          : 'agent-ability-popover__chip'
      }
      disabled={disabled}
      aria-label={
        slotView.ability
          ? slotView.armed
            ? `${slotView.keyLabel}：${slotView.ability.displayName}，点击触发技能`
            : `${slotView.keyLabel}：${slotView.ability.displayName}，点击放置到地图中央`
          : `${slotView.keyLabel}：暂未开放`
      }
      title={
        !slotView.clickable
          ? '大招点数等功能后续开放'
          : slotView.ability
            ? slotView.armed
              ? '已放置：点击触发技能'
              : '点击放置到地图中央'
            : undefined
      }
      onClick={() => {
        if (disabled) return;
        onDeploy(slotView.slot);
      }}
    >
      <span className="agent-ability-popover__key">{slotView.keyLabel}</span>
      <span className="agent-ability-popover__icon-wrap">
        {iconSrc ? (
          <img className="agent-ability-popover__icon" src={iconSrc} alt="" draggable={false} />
        ) : (
          <span className="agent-ability-popover__icon-fallback" aria-hidden />
        )}
      </span>
    </button>
  );
}

export type AgentAbilityPopoverProps = {
  placement: MapAgentPlacement;
  anchor: AbilityPopoverAnchor;
  popoverRef: RefObject<HTMLDivElement | null>;
};

export function AgentAbilityPopover({ placement, anchor, popoverRef }: AgentAbilityPopoverProps) {
  const abilityPlacements = useMatchupStore((s) => s.abilityPlacements);
  const armedSlots = useMemo(
    () =>
      new Set(
        abilityPlacements
          .filter(
            (p) =>
              p.ownerPlacementId === placement.id &&
              (p.anchorMovement?.status === 'armed' || p.damageEffect?.armed)
          )
          .map((p) => p.abilitySlot)
      ),
    [abilityPlacements, placement.id]
  );
  const slots = useMemo(
    () => buildDeploySlots(placement.agentId, armedSlots),
    [armedSlots, placement.agentId]
  );
  const deployAgentAbility = useMatchupStore((s) => s.deployAgentAbility);
  const closeAbilityPopover = useMatchupStore((s) => s.closeAbilityPopover);

  const onDeploy = (abilitySlot: AbilitySlot) => {
    deployAgentAbility({
      ownerPlacementId: placement.id,
      agentId: placement.agentId,
      abilitySlot,
    });
    closeAbilityPopover();
  };

  const left = anchor.clientX + POPOVER_OFFSET_X;
  const top = anchor.clientY + POPOVER_OFFSET_Y;

  return createPortal(
    <div
      ref={popoverRef}
      className="agent-ability-popover"
      style={{ left, top }}
      role="toolbar"
      aria-label="释放技能"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {slots.map((slotView) => (
        <AbilityChip key={slotView.slot} slotView={slotView} onDeploy={onDeploy} />
      ))}
    </div>,
    document.body
  );
}
