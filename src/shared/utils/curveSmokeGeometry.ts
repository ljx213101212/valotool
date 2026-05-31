import type { CurveSmokeGeometry } from '@/shared/types/curveSmoke';

const MIN_POINT_COUNT = 4;

export function polylineLength(points: number[]): number {
  if (points.length < 4) return 0;
  let len = 0;
  for (let i = 2; i < points.length; i += 2) {
    const dx = points[i] - points[i - 2];
    const dy = points[i + 1] - points[i - 1];
    len += Math.hypot(dx, dy);
  }
  return len;
}

export function curveSmokeFromPlacement(placement: {
  curveSmoke?: CurveSmokeGeometry;
}): CurveSmokeGeometry | null {
  const pts = placement.curveSmoke?.points;
  if (!pts || pts.length < MIN_POINT_COUNT) return null;
  if (!pts.every((n) => Number.isFinite(n))) return null;
  return { points: pts };
}

/** 曲线锚点：路径首点 */
export function curveSmokeAnchor(points: number[]): { x: number; y: number } {
  if (points.length >= 2) {
    return { x: points[0], y: points[1] };
  }
  return { x: 0, y: 0 };
}

export function isValidCurveSmokePoints(points: number[]): boolean {
  return points.length >= MIN_POINT_COUNT && points.every((n) => Number.isFinite(n));
}

/** 将新点限制在距上一采样点不超过剩余长度的位置 */
function clampSegmentToRemaining(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  remaining: number,
): [number, number] {
  if (remaining <= 0) return [fromX, fromY];
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.hypot(dx, dy);
  if (dist <= remaining || dist < 1e-6) {
    return [toX, toY];
  }
  const t = remaining / dist;
  return [fromX + dx * t, fromY + dy * t];
}

/**
 * 追加曲线采样点；折线总长度不超过 maxLength（地图坐标）。
 * 已达上限时不再延长路径。
 */
export function appendCurvePoint(
  points: number[],
  x: number,
  y: number,
  maxLength: number,
  minDist = 4,
): number[] {
  if (points.length < 2) {
    return [x, y];
  }

  const currentLen = polylineLength(points);
  if (currentLen >= maxLength - 1e-6) {
    return points;
  }

  const lx = points[points.length - 2];
  const ly = points[points.length - 1];
  const remaining = maxLength - currentLen;
  const [cx, cy] = clampSegmentToRemaining(lx, ly, x, y, remaining);

  const dx = cx - lx;
  const dy = cy - ly;
  if (dx * dx + dy * dy < minDist * minDist) {
    return points;
  }

  const next = [...points, cx, cy];
  if (polylineLength(next) >= maxLength - 1e-6) {
    return next;
  }
  return next;
}

/** 确认前裁剪路径，保证不超过上限 */
export function clampCurvePointsToMaxLength(points: number[], maxLength: number): number[] {
  if (points.length < 4) return points;
  let out = [points[0], points[1]];
  for (let i = 2; i < points.length; i += 2) {
    const prev = appendCurvePoint(out, points[i], points[i + 1], maxLength);
    out = prev;
    if (polylineLength(out) >= maxLength - 1e-6) break;
  }
  return out;
}
