import { type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { getAbilityDisplayName } from '@/features/abilities/abilityDisplayName';
import { useMatchupStore } from '@/shared/store/useMatchupStore';
import type { AbilityPlacement, AbilityPopoverAnchor } from '@/shared/types/ability';
import './AbilityInstanceActionPopover.less';

const POPOVER_OFFSET_X = 12;
const POPOVER_OFFSET_Y = 8;

export type AbilityInstanceActionPopoverProps = {
  placement: AbilityPlacement;
  anchor: AbilityPopoverAnchor;
  popoverRef: RefObject<HTMLDivElement | null>;
};

export function AbilityInstanceActionPopover({
  placement,
  anchor,
  popoverRef,
}: AbilityInstanceActionPopoverProps) {
  const closeAbilityInstancePopover = useMatchupStore((s) => s.closeAbilityInstancePopover);
  const removeAbilityPlacement = useMatchupStore((s) => s.removeAbilityPlacement);
  const recallAbilityPlacement = useMatchupStore((s) => s.recallAbilityPlacement);

  const left = anchor.clientX + POPOVER_OFFSET_X;
  const top = anchor.clientY + POPOVER_OFFSET_Y;
  const name = getAbilityDisplayName(placement.agentId, placement.abilitySlot);

  const onDelete = () => {
    removeAbilityPlacement(placement.id);
    closeAbilityInstancePopover();
  };

  const onRecall = () => {
    recallAbilityPlacement(placement.id);
    closeAbilityInstancePopover();
  };

  return createPortal(
    <div
      ref={popoverRef}
      className="ability-instance-popover"
      style={{ left, top }}
      role="menu"
      aria-label={`技能操作：${name}`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <p className="ability-instance-popover__title">{name} · 未生效</p>
      <button
        type="button"
        className="ability-instance-popover__action"
        disabled
        title="激活逻辑待开发（烟/位移/道具等模块）"
      >
        激活
      </button>
      <button
        type="button"
        className="ability-instance-popover__action"
        onClick={onRecall}
        title="移除技能并归还技能点（归还逻辑待开发）"
      >
        回撤
      </button>
      <button
        type="button"
        className="ability-instance-popover__action ability-instance-popover__action--danger"
        onClick={onDelete}
        title="仅移除地图上的技能，不归还技能点"
      >
        删除
      </button>
    </div>,
    document.body
  );
}
