import { valorantMap } from '@/shared/data/valorantMap';
import type { Point } from '@/shared/types/map';
import type { AbilityPlacement } from '@/shared/types/ability';

/** 与 `reconcileMapPlacements` 默认落点间距同量级 */
const ABILITY_SPAWN_STEP_X = 36;
/** 与 `MapAbilityToken` 直径（MARKER_R * 2）接近，用于判定中心是否已被占用 */
const ABILITY_SPAWN_MIN_DIST = 28;

function mapCenter(): Point {
  const { min, max } = valorantMap.bounds;
  return {
    x: Math.round(((min.x + max.x) / 2) * 100) / 100,
    y: Math.round(((min.y + max.y) / 2) * 100) / 100,
  };
}

function isOccupied(x: number, y: number, existing: AbilityPlacement[]): boolean {
  const minDist = ABILITY_SPAWN_MIN_DIST;
  return existing.some((p) => Math.hypot(p.x - x, p.y - y) < minDist);
}

/** 优先地图正中央；若已有技能实例则沿 X 轴左右错开 */
export function nextAbilitySpawnPoint(existing: AbilityPlacement[]): Point {
  const center = mapCenter();
  if (!isOccupied(center.x, center.y, existing)) return center;

  for (let i = 1; i <= 24; i++) {
    const dx = i * ABILITY_SPAWN_STEP_X;
    const right = { x: center.x + dx, y: center.y };
    if (!isOccupied(right.x, right.y, existing)) return right;
    const left = { x: center.x - dx, y: center.y };
    if (!isOccupied(left.x, left.y, existing)) return left;
  }

  return center;
}
