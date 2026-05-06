import type { Point, Wall } from '../types/map';

// 计算两条线段的交点
export function lineIntersection(
  a1: Point, a2: Point,
  b1: Point, b2: Point
): Point | null {
  const denom = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
  if (denom === 0) return null;

  const ua = ((b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x)) / denom;
  const ub = ((a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x)) / denom;

  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: a1.x + ua * (a2.x - a1.x),
      y: a1.y + ua * (a2.y - a1.y),
    };
  }
  return null;
}

// 计算视野多边形（核心！）
export function calculateViewPolygon(
  player: Point,
  walls: Wall[],
  viewRange: number = 400
): Point[] {
  const points: Point[] = [];
  const step = (Math.PI * 2) / 180; // 每2度发射一条射线

  for (let angle = 0; angle < Math.PI * 2; angle += step) {
    const rayEnd: Point = {
      x: player.x + Math.cos(angle) * viewRange,
      y: player.y + Math.sin(angle) * viewRange,
    };

    let closest = rayEnd;
    let minDist = viewRange;

    for (const wall of walls) {
      if (!wall.isOpaque) continue;

      const hit = lineIntersection(player, rayEnd, wall.line[0], wall.line[1]);
      if (hit) {
        const dist = Math.hypot(hit.x - player.x, hit.y - player.y);
        if (dist < minDist) {
          minDist = dist;
          closest = hit;
        }
      }
    }
    points.push(closest);
  }
  return points;
}