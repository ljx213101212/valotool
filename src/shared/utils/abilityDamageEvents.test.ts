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
