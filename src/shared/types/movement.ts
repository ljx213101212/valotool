export type DirectMovementGeometry = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  facing: number;
  /** 施放到实际移动生效的延迟，秒；用于后续动画/说明 */
  activationDelaySec?: number;
};

export type MovementAnchorKind = 'refract' | 'rendezvous' | 'blast-pack';

export type MovementAnchorStatus = 'armed' | 'triggered';

export type MovementAnchorGeometry = {
  kind: MovementAnchorKind;
  status: MovementAnchorStatus;
  /** 可选作用半径/可放置半径，地图坐标 */
  radius?: number;
};
