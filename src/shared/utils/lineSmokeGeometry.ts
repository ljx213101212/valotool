import type { LineSmokeGeometry } from '@/shared/types/lineSmoke';

export type FixedDualLineSegments = {
  lane1: [number, number, number, number];
  lane2: [number, number, number, number];
};

/** 以中心点为基准，沿 facing 方向延伸的双平行线段端点 */
export function computeFixedDualLineSegments(
  cx: number,
  cy: number,
  facing: number,
  length: number,
  spacing: number,
): FixedDualLineSegments {
  const halfLen = length / 2;
  const dirX = Math.cos(facing);
  const dirY = Math.sin(facing);
  const perpX = -dirY;
  const perpY = dirX;
  const halfGap = spacing / 2;

  const lane = (offset: number): [number, number, number, number] => {
    const ox = cx + perpX * offset;
    const oy = cy + perpY * offset;
    return [
      ox - dirX * halfLen,
      oy - dirY * halfLen,
      ox + dirX * halfLen,
      oy + dirY * halfLen,
    ];
  };

  return { lane1: lane(halfGap), lane2: lane(-halfGap) };
}

export function lineSmokeFromPlacement(
  placement: { x: number; y: number; lineSmoke?: LineSmokeGeometry },
): LineSmokeGeometry | null {
  if (placement.lineSmoke) return placement.lineSmoke;
  return null;
}

/** 可转向单墙线段端点（以中心沿 facing ±半长） */
export function computeWallSegment(
  cx: number,
  cy: number,
  facing: number,
  length: number,
): [number, number, number, number] {
  const halfLen = length / 2;
  const dirX = Math.cos(facing);
  const dirY = Math.sin(facing);
  return [
    cx - dirX * halfLen,
    cy - dirY * halfLen,
    cx + dirX * halfLen,
    cy + dirY * halfLen,
  ];
}
