/** 固定双线烟几何（中心点 + 朝向，车道由配置长度/间距推导） */
export type LineSmokeGeometry = {
  cx: number;
  cy: number;
  /** 车道延伸方向（弧度），沿该方向 ±半长 */
  facing: number;
};
