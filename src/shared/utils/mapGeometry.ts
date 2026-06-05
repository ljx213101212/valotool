import type { Point, Wall } from '@/shared/types/map';

const EPSILON = 1e-6;
const MIN_HIT_DISTANCE = 1e-4;

export type MapGeometrySegment = {
  from: Point;
  to: Point;
};

export type WallHit = {
  wall: Wall;
  point: Point;
  distance: number;
};

export type LineOfSightResult = {
  source: Point;
  target: Point;
  blocked: boolean;
  hit: WallHit | null;
};

export type WallRaycastResult = {
  origin: Point;
  direction: Point;
  maxDistance: number;
  terminal: Point;
  hit: WallHit | null;
};

export type WallBounceTrace = {
  origin: Point;
  segments: MapGeometrySegment[];
  hits: WallHit[];
  terminal: Point;
};

export function lineSegmentIntersection(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point,
): Point | null {
  const adx = a2.x - a1.x;
  const ady = a2.y - a1.y;
  const bdx = b2.x - b1.x;
  const bdy = b2.y - b1.y;
  const denom = cross({ x: adx, y: ady }, { x: bdx, y: bdy });
  if (Math.abs(denom) < EPSILON) return null;

  const delta = { x: b1.x - a1.x, y: b1.y - a1.y };
  const ua = cross(delta, { x: bdx, y: bdy }) / denom;
  const ub = cross(delta, { x: adx, y: ady }) / denom;
  if (ua < -EPSILON || ua > 1 + EPSILON || ub < -EPSILON || ub > 1 + EPSILON) {
    return null;
  }

  return {
    x: a1.x + ua * adx,
    y: a1.y + ua * ady,
  };
}

export function isLineOfSightBlocked(input: {
  source: Point;
  target: Point;
  walls: Wall[];
}): LineOfSightResult {
  const hit = nearestWallHitOnSegment(input.source, input.target, input.walls);
  return {
    source: input.source,
    target: input.target,
    blocked: !!hit,
    hit,
  };
}

export function findFirstWallHit(input: {
  origin: Point;
  direction: Point;
  maxDistance: number;
  walls: Wall[];
}): WallRaycastResult {
  const direction = normalize(input.direction);
  const rayEnd = {
    x: input.origin.x + direction.x * input.maxDistance,
    y: input.origin.y + direction.y * input.maxDistance,
  };
  const hit = nearestWallHitOnSegment(input.origin, rayEnd, input.walls);

  return {
    origin: input.origin,
    direction,
    maxDistance: input.maxDistance,
    terminal: hit?.point ?? rayEnd,
    hit,
  };
}

export function traceWallBounces(input: {
  origin: Point;
  direction: Point;
  maxDistance: number;
  bounceCount: number;
  walls: Wall[];
}): WallBounceTrace {
  const segments: MapGeometrySegment[] = [];
  const hits: WallHit[] = [];
  let origin = input.origin;
  let direction = normalize(input.direction);
  let remainingDistance = Math.max(0, input.maxDistance);
  let remainingBounces = Math.max(0, Math.floor(input.bounceCount));

  while (remainingDistance > EPSILON) {
    const ray = findFirstWallHit({
      origin,
      direction,
      maxDistance: remainingDistance,
      walls: input.walls,
    });

    segments.push({ from: origin, to: ray.terminal });
    if (!ray.hit) {
      return {
        origin: input.origin,
        segments,
        hits,
        terminal: ray.terminal,
      };
    }

    hits.push(ray.hit);
    if (remainingBounces <= 0) {
      return {
        origin: input.origin,
        segments,
        hits,
        terminal: ray.terminal,
      };
    }

    remainingDistance -= ray.hit.distance;
    remainingBounces -= 1;
    direction = reflectVector(direction, wallDirection(ray.hit.wall));
    origin = offsetPoint(ray.hit.point, direction, EPSILON * 10);
  }

  const terminal = segments.at(-1)?.to ?? input.origin;
  return {
    origin: input.origin,
    segments,
    hits,
    terminal,
  };
}

export function projectileImpactPointsFromTrace(trace: WallBounceTrace): Point[] {
  const points = trace.hits.map((hit) => hit.point);
  if (!points.some((point) => samePoint(point, trace.terminal))) {
    points.push(trace.terminal);
  }
  return points;
}

function nearestWallHitOnSegment(source: Point, target: Point, walls: Wall[]): WallHit | null {
  let closest: WallHit | null = null;
  for (const wall of walls) {
    if (!wall.isOpaque) continue;
    const point = lineSegmentIntersection(source, target, wall.line[0], wall.line[1]);
    if (!point) continue;
    const distance = distanceBetween(source, point);
    if (distance <= MIN_HIT_DISTANCE) continue;
    if (!closest || distance < closest.distance) {
      closest = { wall, point, distance };
    }
  }
  return closest;
}

function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalize(value: Point): Point {
  const len = Math.hypot(value.x, value.y);
  if (len <= EPSILON) return { x: 1, y: 0 };
  return { x: value.x / len, y: value.y / len };
}

function wallDirection(wall: Wall): Point {
  return normalize({
    x: wall.line[1].x - wall.line[0].x,
    y: wall.line[1].y - wall.line[0].y,
  });
}

function reflectVector(direction: Point, tangent: Point): Point {
  const dot = direction.x * tangent.x + direction.y * tangent.y;
  const projection = { x: tangent.x * dot, y: tangent.y * dot };
  const normalComponent = {
    x: direction.x - projection.x,
    y: direction.y - projection.y,
  };
  return normalize({
    x: projection.x - normalComponent.x,
    y: projection.y - normalComponent.y,
  });
}

function offsetPoint(point: Point, direction: Point, amount: number): Point {
  return {
    x: point.x + direction.x * amount,
    y: point.y + direction.y * amount,
  };
}

function samePoint(a: Point, b: Point): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) <= MIN_HIT_DISTANCE;
}
