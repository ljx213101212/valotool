import type { AbilityPlacement } from '@/shared/types/ability';
import type { DirectMovementGeometry } from '@/shared/types/movement';

export function clampPointToMovementRange(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  maxRange: number,
): { x: number; y: number; facing: number } {
  const dx = targetX - startX;
  const dy = targetY - startY;
  const dist = Math.hypot(dx, dy);
  const facing = dist > 1e-6 ? Math.atan2(dy, dx) : 0;
  if (dist <= maxRange || dist <= 1e-6) {
    return { x: targetX, y: targetY, facing };
  }
  const scale = maxRange / dist;
  return {
    x: startX + dx * scale,
    y: startY + dy * scale,
    facing,
  };
}

export function directMovementFromPlacement(
  placement: AbilityPlacement,
): DirectMovementGeometry | null {
  return placement.directMovement ?? null;
}
