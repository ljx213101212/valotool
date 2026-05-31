export type MovementDisplacement = {
  placementId?: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  facing: number;
};

export type DirectMovementGeometry = MovementDisplacement & {
  /** 施放到实际移动生效的延迟，秒；用于后续动画/说明 */
  activationDelaySec?: number;
  /** 单个技能造成的多目标位移，例如 Raze 炸药包爆风 */
  impactedPlacements?: MovementDisplacement[];
};

export type MovementAnchorKind = 'refract' | 'rendezvous' | 'blast-pack';

export type MovementAnchorStatus = 'armed' | 'triggered';

export type MovementAnchorGeometry = {
  kind: MovementAnchorKind;
  status: MovementAnchorStatus;
  /** 可选作用半径/可放置半径，地图坐标 */
  radius?: number;
};
