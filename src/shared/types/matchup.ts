import type { CombatState } from '@/shared/types/damage';

export type MatchupSide = 'attack' | 'defense';

export interface MapAgentPlacement {
  id: string;
  side: MatchupSide;
  agentId: string;
  x: number;
  y: number;
  /** 朝向（弧度），0 为 +x 方向，逆时针为正（与 Math.atan2 一致） */
  facing: number;
  /** 被击杀后为 true；由关键帧快照与击杀记录同步 */
  eliminated?: boolean;
  /** 击杀者 placement id，仅 `eliminated` 时为真 */
  eliminatedByPlacementId?: string;
  /** 该特工在本回合起点的血甲状态 */
  initialCombatState?: CombatState;
  /** 当前时间点推导出的血甲状态 */
  combatState?: CombatState;
}
