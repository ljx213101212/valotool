import type { AbilitySlot } from '@/features/abilities/config';

/** 球型烟雾在时间轴上的施放阶段 */
export type TimelineAbilityDeployPhase = 'start' | 'end';

/** 关键帧「技能施放」栏目中的一条记录 */
export type TimelineAbilityDeployEvent = {
  abilityPlacementId: string;
  ownerPlacementId: string;
  agentId: string;
  abilitySlot: AbilitySlot;
  phase: TimelineAbilityDeployPhase;
};
