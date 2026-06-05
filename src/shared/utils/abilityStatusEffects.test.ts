import assert from 'node:assert/strict';
import {
  computeCircularConcussTargets,
  computeCircularConcussTargetsFromSources,
  computeFlashExposure,
  computeFlashTargets,
  computeLineZoneStatusTargets,
  strongestActiveStatusForTarget,
  resolveStatusOverlayOpacity,
  statusStrengthForSeverity,
  updateAffectedStatusSeverity,
} from './abilityStatusEffects';
import type { MapAgentPlacement } from '@/shared/types/matchup';
import type { Wall } from '@/shared/types/map';

function agent(
  id: string,
  side: MapAgentPlacement['side'],
  x: number,
  y: number,
  facing: number,
): MapAgentPlacement {
  return { id, side, agentId: id, x, y, facing };
}

const source = { x: 0, y: 0 };
const blockingWall: Wall = {
  id: 'flash-blocker',
  line: [
    { x: 25, y: -10 },
    { x: 25, y: 10 },
  ],
  isOpaque: true,
};

assert.equal(
  computeFlashExposure({
    source,
    target: agent('front', 'defense', 100, 0, Math.PI),
    radius: 200,
  }).severity,
  'front',
);

assert.equal(
  computeFlashExposure({
    source,
    target: agent('side', 'defense', 100, 0, Math.PI / 2),
    radius: 200,
  }).severity,
  'side',
);

assert.equal(
  computeFlashExposure({
    source,
    target: agent('back', 'defense', 100, 0, 0),
    radius: 200,
  }).severity,
  'back',
);

assert.equal(
  computeFlashExposure({
    source,
    target: agent('far', 'defense', 250, 0, Math.PI),
    radius: 200,
  }).severity,
  'miss',
);

assert.deepEqual(
  computeFlashTargets({
    source,
    casterSide: 'attack',
    affects: 'enemies-only',
    radius: 200,
    targets: [
      agent('friendly', 'attack', 50, 0, Math.PI),
      agent('enemy', 'defense', 50, 0, Math.PI),
    ],
    startsAt: 10,
    durationSec: 2,
    fadeSec: 1,
    effect: 'flash',
  }).map((status) => status.targetPlacementId),
  ['enemy'],
);

assert.deepEqual(
  computeFlashTargets({
    source,
    casterSide: 'attack',
    affects: 'enemies-only',
    radius: 200,
    targets: [agent('blocked-enemy', 'defense', 50, 0, Math.PI)],
    startsAt: 10,
    durationSec: 2,
    fadeSec: 1,
    effect: 'flash',
    walls: [blockingWall],
  }).map((status) => status.targetPlacementId),
  [],
);

assert.deepEqual(
  computeFlashTargets({
    source,
    casterSide: 'attack',
    affects: 'enemies-only',
    radius: 200,
    targets: [agent('visible-enemy', 'defense', 50, 30, Math.PI)],
    startsAt: 10,
    durationSec: 2,
    fadeSec: 1,
    effect: 'flash',
    walls: [blockingWall],
  }).map((status) => status.targetPlacementId),
  ['visible-enemy'],
);

assert.deepEqual(
  computeCircularConcussTargets({
    source,
    casterSide: 'attack',
    affects: 'all-players',
    radius: 100,
    targets: [
      agent('inside', 'defense', 75, 0, 0),
      agent('outside', 'defense', 125, 0, 0),
    ],
    startsAt: 5,
    durationSec: 3,
    fadeSec: 0,
  }).map((status) => status.targetPlacementId),
  ['inside'],
);

assert.deepEqual(
  computeCircularConcussTargetsFromSources({
    sources: [
      { x: 0, y: 0 },
      { x: 120, y: 0 },
    ],
    casterSide: 'attack',
    affects: 'all-players',
    radius: 50,
    targets: [
      agent('first-impact', 'defense', 30, 0, 0),
      agent('second-impact', 'defense', 130, 0, 0),
      agent('outside', 'defense', 80, 80, 0),
    ],
    startsAt: 5,
    durationSec: 3,
    fadeSec: 0,
  }).map((status) => status.targetPlacementId),
  ['first-impact', 'second-impact'],
);

assert.deepEqual(
  computeLineZoneStatusTargets({
    origin: source,
    facing: 0,
    length: 200,
    width: 80,
    casterSide: 'attack',
    affects: 'all-players',
    targets: [
      agent('inside-line', 'defense', 120, 20, 0),
      agent('behind', 'defense', -20, 0, 0),
      agent('outside-width', 'defense', 120, 60, 0),
    ],
    startsAt: 5,
    durationSec: 3,
    fadeSec: 0,
    effect: 'concuss',
  }).map((status) => status.targetPlacementId),
  ['inside-line'],
);

assert.ok(statusStrengthForSeverity('front') > statusStrengthForSeverity('side'));
assert.ok(statusStrengthForSeverity('side') > statusStrengthForSeverity('back'));
assert.equal(statusStrengthForSeverity('miss'), 0);

assert.equal(
  resolveStatusOverlayOpacity({
    strength: 0.8,
    startsAt: 1,
    endsAt: 3,
    fadeEndsAt: 5,
    playheadSec: 0.5,
  }),
  0,
);

const corrected = updateAffectedStatusSeverity(
  {
    targetPlacementId: 'enemy',
    effect: 'flash',
    severity: 'front',
    strength: 0.9,
    startsAt: 1,
    endsAt: 3,
    fadeEndsAt: 4,
  },
  'back',
);

assert.equal(corrected.severity, 'back');
assert.equal(corrected.manual, true);
assert.equal(corrected.strength, statusStrengthForSeverity('back'));

assert.equal(
  strongestActiveStatusForTarget(
    [
      corrected,
      {
        targetPlacementId: 'enemy',
        effect: 'flash',
        severity: 'side',
        strength: 0.55,
        startsAt: 1,
        endsAt: 4,
        fadeEndsAt: 5,
      },
    ],
    'enemy',
    2,
  )?.severity,
  'side',
);

assert.equal(
  resolveStatusOverlayOpacity({
    strength: 0.8,
    startsAt: 1,
    endsAt: 3,
    fadeEndsAt: 5,
    playheadSec: 2,
  }),
  0.8,
);

assert.equal(
  resolveStatusOverlayOpacity({
    strength: 0.8,
    startsAt: 1,
    endsAt: 3,
    fadeEndsAt: 5,
    playheadSec: 5,
  }),
  0,
);
