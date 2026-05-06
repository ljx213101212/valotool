export type MatchupSide = 'attack' | 'defense';

export interface MapAgentPlacement {
  id: string;
  side: MatchupSide;
  agentId: string;
  x: number;
  y: number;
  /** 朝向（弧度），0 为 +x 方向，逆时针为正（与 Math.atan2 一致） */
  facing: number;
}
