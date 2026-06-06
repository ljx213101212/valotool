import assert from 'node:assert/strict';
import { getAbilityEffectMeta } from '../../features/abilities/config';
import { computeAbilityDamageEvents } from './abilityDamageEvents';
import type { MapAgentPlacement } from '@/shared/types/matchup';

function agent(
  id: string,
  side: MapAgentPlacement['side'],
  x: number,
  y: number,
): MapAgentPlacement {
  return {
    id,
    side,
    agentId: id,
    x,
    y,
    facing: 0,
  };
}

const shockBolt = getAbilityEffectMeta('sova', 'Ability1')?.damage;
assert.ok(shockBolt);

const shockEvents = computeAbilityDamageEvents({
  idPrefix: 'shock',
  damage: shockBolt,
  abilityId: 'sova-shock-bolt',
  casterPlacementId: 'caster',
  deploymentId: 'ability-1',
  source: { x: 0, y: 0 },
  casterSide: 'attack',
  targets: [
    agent('friendly', 'attack', 0, 0),
    agent('center', 'defense', 0, 0),
    agent('edge', 'defense', shockBolt.shape.kind === 'circle' ? shockBolt.shape.outerRadius : 0, 0),
    agent('outside', 'defense', 999, 0),
  ],
  startsAt: 10,
});

assert.deepEqual(
  shockEvents.map((event) => [event.targetPlacementId, event.rawDamage]),
  [
    ['friendly', 75],
    ['center', 75],
    ['edge', 1],
  ],
);
assert.equal(shockEvents[0].time, 10);
assert.equal(shockEvents[0].source.type, 'ability');
assert.equal(shockEvents[0].source.deploymentId, 'ability-1');

const nanoswarm = getAbilityEffectMeta('killjoy', 'Grenade')?.damage;
assert.ok(nanoswarm);

const nanoswarmEvents = computeAbilityDamageEvents({
  idPrefix: 'nano',
  damage: { ...nanoswarm, supportStatus: 'supported' },
  abilityId: 'killjoy-nanoswarm',
  casterPlacementId: 'caster',
  deploymentId: 'ability-2',
  source: { x: 0, y: 0 },
  casterSide: 'attack',
  targets: [agent('inside', 'defense', 0, 0)],
  startsAt: 20,
});

assert.equal(nanoswarmEvents.length, 180);
assert.equal(nanoswarmEvents[0].rawDamage, 1);
assert.equal(nanoswarmEvents[0].time, 20);
assert.equal(nanoswarmEvents.at(-1)?.time, 23.98);

// -- Temporal damage tests (Mosh Pit, Incendiary, Nanoswarm) --

const moshPit = getAbilityEffectMeta('gekko', 'Grenade')?.damage;
assert.ok(moshPit);
assert.equal(moshPit.timing.kind, 'windup-then-persistent');

const moshEvents = computeAbilityDamageEvents({
  idPrefix: 'mosh',
  damage: moshPit,
  abilityId: 'gekko-mosh-pit',
  casterPlacementId: 'caster',
  deploymentId: 'deploy-mosh',
  source: { x: 0, y: 0 },
  casterSide: 'attack',
  targets: [
    agent('inner', 'defense', 0, 0),
    agent('outer', 'defense', moshPit.shape.kind === 'circle' ? moshPit.shape.outerRadius : 0, 0),
    agent('outside', 'defense', 999, 0),
  ],
  startsAt: 10,
});
// Mosh Pit: 3 ticks × 2 targets = 6 events
assert.equal(moshEvents.length, 6);
// Windup = 3s, first event at 10 + 3 = 13
assert.equal(moshEvents[0].time, 13);
assert.equal(moshEvents[0].source.deploymentId, 'deploy-mosh');
// inner target gets 50 per tick (tickDamage)
assert.equal(moshEvents[0].targetPlacementId, 'inner');
assert.equal(moshEvents[0].rawDamage, 50);
// outer target also gets tickDamage (50) per tick since persistent tickDamage doesn't use falloff
const outerEvents = moshEvents.filter((e) => e.targetPlacementId === 'outer');
assert.equal(outerEvents.length, 3);
assert.equal(outerEvents[0].rawDamage, 50);
// outside target excluded
assert.equal(moshEvents.some((e) => e.targetPlacementId === 'outside'), false);
// Events are grouped per-target, per-tick. Verify all events have valid times.
const moshTimes = moshEvents.map((e) => e.time).sort((a, b) => a - b);
assert.equal(moshTimes[0], 13);
assert.ok(moshTimes.at(-1)! >= 14.9);
// Events are deterministic: second call should match
const moshEvents2 = computeAbilityDamageEvents({
  idPrefix: 'mosh',
  damage: moshPit,
  abilityId: 'gekko-mosh-pit',
  casterPlacementId: 'caster',
  deploymentId: 'deploy-mosh',
  source: { x: 0, y: 0 },
  casterSide: 'attack',
  targets: [
    agent('inner', 'defense', 0, 0),
    agent('outer', 'defense', moshPit.shape.kind === 'circle' ? moshPit.shape.outerRadius : 0, 0),
    agent('outside', 'defense', 999, 0),
  ],
  startsAt: 10,
});
assert.equal(moshEvents2.length, 6);
assert.deepEqual(moshEvents2.map((e) => e.id), moshEvents.map((e) => e.id));

const incendiary = getAbilityEffectMeta('brimstone', 'Ability1')?.damage;
assert.ok(incendiary);
assert.equal(incendiary.timing.kind, 'persistent');

const incEvents = computeAbilityDamageEvents({
  idPrefix: 'inc',
  damage: incendiary,
  abilityId: 'brim-incendiary',
  casterPlacementId: 'caster',
  deploymentId: 'deploy-inc',
  source: { x: 0, y: 0 },
  casterSide: 'attack',
  targets: [agent('target', 'defense', 0, 0)],
  startsAt: 0,
});
// Incendiary: 8s duration, 60 ticks/s = 480 ticks
assert.equal(incEvents.length, 480);
assert.equal(incEvents[0].time, 0);
assert.equal(incEvents[0].rawDamage, 1);
assert.equal(incEvents.at(-1)!.time, 7.98);
// All events share same deployment id
assert.ok(incEvents.every((e) => e.source.deploymentId === 'deploy-inc'));

// -- High tick-rate quantization test: verify that close tick times produce deterministic, ordered IDs --
const incFirst10 = incEvents.slice(0, 10);
for (let i = 0; i < incFirst10.length; i++) {
  assert.equal(incFirst10[i].id, `inc-0-${i}`);
}
// Verify that if we call again with same parameters we get same event IDs
const incEvents2 = computeAbilityDamageEvents({
  idPrefix: 'inc',
  damage: incendiary,
  abilityId: 'brim-incendiary',
  casterPlacementId: 'caster',
  deploymentId: 'deploy-inc',
  source: { x: 0, y: 0 },
  casterSide: 'attack',
  targets: [agent('target', 'defense', 0, 0)],
  startsAt: 0,
});
assert.equal(incEvents2[0].id, 'inc-0-0');
assert.equal(incEvents2.at(-1)!.id, 'inc-0-479');

// -- Armed Nanoswarm still returns no events when armed (events are generated on trigger) --
// The armed flag in metadata is checked during placement, not event generation;
// but if someone calls computeAbilityDamageEvents directly with armed damage,
// it still produces events normally since the function only filters on supportStatus
const armedNanoswarm = getAbilityEffectMeta('killjoy', 'Grenade')?.damage;
assert.ok(armedNanoswarm);
assert.equal(armedNanoswarm?.armed, true);
assert.equal(armedNanoswarm?.supportStatus, 'supported');

const nanoEventsDirect = computeAbilityDamageEvents({
  idPrefix: 'nano-armed',
  damage: armedNanoswarm!,
  abilityId: 'kj-nanoswarm',
  casterPlacementId: 'caster',
  deploymentId: 'deploy-nano',
  source: { x: 0, y: 0 },
  casterSide: 'attack',
  targets: [agent('inside', 'defense', 0, 0)],
  startsAt: 20,
});
// Nanoswarm has 180 ticks (4s × 45/s)
assert.equal(nanoEventsDirect.length, 180);
assert.equal(nanoEventsDirect[0].source.deploymentId, 'deploy-nano');

const aftershock = getAbilityEffectMeta('breach', 'Grenade')?.damage;
assert.ok(aftershock);
assert.deepEqual(
  computeAbilityDamageEvents({
    idPrefix: 'unsupported',
    damage: aftershock,
    abilityId: 'breach-aftershock',
    casterPlacementId: 'caster',
    deploymentId: 'ability-3',
    source: { x: 0, y: 0 },
    casterSide: 'attack',
    targets: [agent('inside', 'defense', 0, 0)],
    startsAt: 20,
  }),
  [],
);
