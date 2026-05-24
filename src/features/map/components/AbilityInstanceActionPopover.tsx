import { type RefObject } from 'react';
import { AbilityInstancePreparationPopover } from '@/features/map/components/AbilityInstancePreparationPopover';
import { AbilityInstanceTimelinePopover } from '@/features/map/components/AbilityInstanceTimelinePopover';
import type { AbilityPlacement, AbilityPopoverAnchor } from '@/shared/types/ability';

export type AbilityInstanceActionPopoverProps = {
  placement: AbilityPlacement;
  anchor: AbilityPopoverAnchor;
  popoverRef: RefObject<HTMLDivElement | null>;
};

/**
 * ⌘/Ctrl+点击技能实例时的操作菜单路由：
 * - `initial` → 预备期（激活 / 回撤 / 删除）
 * - 已施放 → 时间轴操作（施放时间 / 结束时间 / 删除）
 */
export function AbilityInstanceActionPopover(props: AbilityInstanceActionPopoverProps) {
  if (props.placement.state === 'initial') {
    return <AbilityInstancePreparationPopover {...props} />;
  }
  return <AbilityInstanceTimelinePopover {...props} />;
}
