import type { AbilitySlot } from '@/features/abilities/config';

/** 地图上已释放的技能实例 */
export type AbilityPlacement = {
  id: string;
  ownerPlacementId: string;
  agentId: string;
  abilitySlot: AbilitySlot;
  x: number;
  y: number;
};

export type AbilityPopoverAnchor = {
  clientX: number;
  clientY: number;
};
