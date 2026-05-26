import { type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { getAbilityDisplayName } from '@/features/abilities/abilityDisplayName';
import {
  isFixedDualLineSmokeAbility,
  isReleasePlacementSmokeAbility,
  isSphericalSmokeAbility,
} from '@/features/abilities/config';
import { useMatchupStore } from '@/shared/store/useMatchupStore';
import type { AbilityPlacement, AbilityPopoverAnchor } from '@/shared/types/ability';
import './AbilityInstanceActionPopover.less';

const POPOVER_OFFSET_X = 12;
const POPOVER_OFFSET_Y = 8;

export type AbilityInstancePreparationPopoverProps = {
  placement: AbilityPlacement;
  anchor: AbilityPopoverAnchor;
  popoverRef: RefObject<HTMLDivElement | null>;
};

/** 预备期：特工已决定施放技能，具体落点与释放形式在「激活」后进入释放期完成 */
export function AbilityInstancePreparationPopover({
  placement,
  anchor,
  popoverRef,
}: AbilityInstancePreparationPopoverProps) {
  const closeAbilityInstancePopover = useMatchupStore((s) => s.closeAbilityInstancePopover);
  const removeAbilityPlacement = useMatchupStore((s) => s.removeAbilityPlacement);
  const recallAbilityPlacement = useMatchupStore((s) => s.recallAbilityPlacement);
  const beginSphericalSmokePlacement = useMatchupStore((s) => s.beginSphericalSmokePlacement);
  const beginFixedDualLineSmokePlacement = useMatchupStore(
    (s) => s.beginFixedDualLineSmokePlacement
  );

  const canActivate = isReleasePlacementSmokeAbility(
    placement.agentId,
    placement.abilitySlot
  );

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

  const onActivate = () => {
    if (!canActivate) return;
    if (isSphericalSmokeAbility(placement.agentId, placement.abilitySlot)) {
      beginSphericalSmokePlacement(placement.id);
    } else if (isFixedDualLineSmokeAbility(placement.agentId, placement.abilitySlot)) {
      beginFixedDualLineSmokePlacement(placement.id);
    }
    closeAbilityInstancePopover();
  };

  return createPortal(
    <div
      ref={popoverRef}
      className="ability-instance-popover"
      style={{ left, top }}
      role="menu"
      aria-label={`技能预备：${name}`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <p className="ability-instance-popover__title">{name} · 预备期</p>
      <button
        type="button"
        className="ability-instance-popover__action"
        disabled={!canActivate}
        title={
          canActivate
            ? '进入释放期：在地图上选择具体施放位置（Esc 取消）'
            : '该技能暂不支持此释放形式'
        }
        onClick={onActivate}
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
