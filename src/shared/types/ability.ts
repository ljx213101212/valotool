import type { AbilitySlot } from '@/features/abilities/config';

/** 地图上技能实例的生命周期状态（后续可扩展 active 等） */
export type AbilityPlacementState = 'initial';

/** 地图上已释放的技能实例 */
export type AbilityPlacement = {
  id: string;
  ownerPlacementId: string;
  agentId: string;
  abilitySlot: AbilitySlot;
  x: number;
  y: number;
  /** initial：已放置、尚未生效（待激活模块处理） */
  state: AbilityPlacementState;
  /** 放置到地图时的时间戳（ms），用于详情抽屉展示施放时间 */
  placedAt: number;
};

export type AbilityPopoverAnchor = {
  clientX: number;
  clientY: number;
};
