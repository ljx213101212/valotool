import type { AbilitySlot } from '@/features/abilities/config';

/** 技能在时间轴上的施放阶段：烟雾 start/end，位移 instant */
export type TimelineAbilityDeployPhase = 'start' | 'end' | 'instant';

/** 关键帧「技能施放」栏目中的一条记录 */
export type TimelineAbilityDeployEvent = {
  abilityPlacementId: string;
  ownerPlacementId: string;
  agentId: string;
  abilitySlot: AbilitySlot;
  phase: TimelineAbilityDeployPhase;
};
