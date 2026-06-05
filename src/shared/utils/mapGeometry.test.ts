import assert from 'node:assert/strict';
import {
  findFirstWallHit,
  isLineOfSightBlocked,
  projectileImpactPointsFromTrace,
  traceWallBounces,
} from './mapGeometry';
import type { Wall } from '@/shared/types/map';

const verticalWall: Wall = {
  id: 'vertical',
  line: [
    { x: 10, y: -10 },
    { x: 10, y: 10 },
  ],
  isOpaque: true,
};

const fartherWall: Wall = {
  id: 'farther',
  line: [
    { x: 20, y: -10 },
    { x: 20, y: 10 },
  ],
  isOpaque: true,
};

const bounceReturnWall: Wall = {
  id: 'return',
  line: [
    { x: 15, y: 0 },
    { x: 30, y: 0 },
  ],
  isOpaque: true,
};

const transparentWall: Wall = {
  id: 'transparent',
  line: [
    { x: 10, y: -10 },
    { x: 10, y: 10 },
  ],
  isOpaque: false,
};

const horizontalWall: Wall = {
  id: 'horizontal',
  line: [
    { x: -10, y: 10 },
    { x: 10, y: 10 },
  ],
  isOpaque: true,
};

const parallelWall: Wall = {
  id: 'parallel',
  line: [
    { x: 0, y: 5 },
    { x: 20, y: 5 },
  ],
  isOpaque: true,
};

assert.equal(
  isLineOfSightBlocked({
    source: { x: 0, y: 0 },
    target: { x: 30, y: 0 },
    walls: [fartherWall, verticalWall],
  }).blocked,
  true,
);

assert.deepEqual(
  isLineOfSightBlocked({
    source: { x: 0, y: 0 },
    target: { x: 30, y: 0 },
    walls: [fartherWall, verticalWall],
  }).hit?.wall.id,
  'vertical',
);

assert.equal(
  isLineOfSightBlocked({
    source: { x: 0, y: 0 },
    target: { x: 0, y: 30 },
    walls: [verticalWall],
  }).blocked,
  false,
);

assert.equal(
  isLineOfSightBlocked({
    source: { x: 0, y: 0 },
    target: { x: 30, y: 0 },
    walls: [transparentWall],
  }).blocked,
  false,
);

const firstHit = findFirstWallHit({
  origin: { x: 0, y: 0 },
  direction: { x: 1, y: 0 },
  maxDistance: 100,
  walls: [fartherWall, verticalWall],
});

assert.equal(firstHit.hit?.wall.id, 'vertical');
assert.equal(firstHit.hit?.point.x, 10);
assert.equal(firstHit.hit?.point.y, 0);
assert.equal(firstHit.terminal.x, 10);
assert.equal(firstHit.terminal.y, 0);

assert.equal(
  findFirstWallHit({
    origin: { x: 0, y: 0 },
    direction: { x: 1, y: 0 },
    maxDistance: 5,
    walls: [verticalWall],
  }).hit,
  null,
);

assert.equal(
  findFirstWallHit({
    origin: { x: 0, y: 0 },
    direction: { x: 1, y: 0 },
    maxDistance: 100,
    walls: [
      {
        ...verticalWall,
        id: 'behind',
        line: [
          { x: -10, y: -10 },
          { x: -10, y: 10 },
        ],
      },
    ],
  }).hit,
  null,
);

const bounced = traceWallBounces({
  origin: { x: 0, y: 0 },
  direction: { x: 1, y: 1 },
  maxDistance: 50,
  bounceCount: 1,
  walls: [horizontalWall],
});

assert.equal(bounced.hits.length, 1);
assert.equal(bounced.hits[0].wall.id, 'horizontal');
assert.equal(bounced.segments.length, 2);
assert.deepEqual(bounced.segments[0].from, { x: 0, y: 0 });
assert.equal(bounced.segments[0].to.x, 10);
assert.equal(bounced.segments[0].to.y, 10);
assert.ok(bounced.segments[1].to.y < bounced.segments[1].from.y);

assert.equal(
  traceWallBounces({
    origin: { x: 0, y: 0 },
    direction: { x: 1, y: 0 },
    maxDistance: 20,
    bounceCount: 1,
    walls: [parallelWall],
  }).hits.length,
  0,
);

assert.equal(
  traceWallBounces({
    origin: { x: 0, y: 0 },
    direction: { x: 1, y: 0 },
    maxDistance: 100,
    bounceCount: 0,
    walls: [verticalWall],
  }).segments.length,
  1,
);

const twoSurfaceTrace = traceWallBounces({
  origin: { x: 0, y: 0 },
  direction: { x: 1, y: 1 },
  maxDistance: 80,
  bounceCount: 1,
  walls: [horizontalWall, bounceReturnWall],
});

assert.deepEqual(
  twoSurfaceTrace.hits.map((hit) => hit.wall.id),
  ['horizontal', 'return'],
);
assert.equal(twoSurfaceTrace.segments.length, 2);

const twoSurfaceImpacts = projectileImpactPointsFromTrace(twoSurfaceTrace);
assert.equal(twoSurfaceImpacts.length, 2);
assert.ok(Math.abs(twoSurfaceImpacts[0].x - 10) < 1e-6);
assert.ok(Math.abs(twoSurfaceImpacts[0].y - 10) < 1e-6);
assert.ok(Math.abs(twoSurfaceImpacts[1].x - 20) < 1e-6);
assert.ok(Math.abs(twoSurfaceImpacts[1].y - 0) < 1e-6);

const landedTrace = traceWallBounces({
  origin: { x: 0, y: 0 },
  direction: { x: 1, y: 0 },
  maxDistance: 30,
  bounceCount: 1,
  walls: [],
});

assert.deepEqual(projectileImpactPointsFromTrace(landedTrace), [{ x: 30, y: 0 }]);
