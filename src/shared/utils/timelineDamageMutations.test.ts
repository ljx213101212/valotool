import assert from 'node:assert/strict';
import { createDefaultCombatState } from './damageCombat';
import {
  removeDamageEventsForAbilityDeploymentFromSnapshot,
  snapshotWithDamageEventAppended,
} from './timelineDamageMutations';
import type { TimelineKeyframeSnapshot } from '@/shared/types/timelineKeyframe';

function snapshot(): TimelineKeyframeSnapshot {
  return {
    matchup: {
      attackAgentIds: ['sova'],
      defenseAgentIds: ['jett'],
      dragDropTargetSide: 'attack',
      mapPlacements: [
        {
          id: 'caster',
          side: 'attack',
          agentId: 'sova',
          x: 0,
          y: 0,
          facing: 0,
          initialCombatState: createDefaultCombatState('none'),
          combatState: createDefaultCombatState('none'),
        },
        {
          id: 'target',
          side: 'defense',
          agentId: 'jett',
          x: 10,
          y: 0,
          facing: Math.PI,
          initialCombatState: createDefaultCombatState('light'),
          combatState: createDefaultCombatState('light'),
        },
      ],
      abilityPlacements: [],
    },
    mapSelection: {
      selectedMapId: 'split',
      side: 'attack',
    },
    killEvents: [],
    abilityDeployEvents: [],
    damageEvents: [],
  };
}

const damaged = snapshotWithDamageEventAppended(snapshot(), {
  id: 'damage-1',
  time: 5,
  targetPlacementId: 'target',
  rawDamage: 30,
  source: {
    type: 'ability',
    abilityId: 'sova-shock-bolt',
    casterPlacementId: 'caster',
    deploymentId: 'ability-1',
  },
});

assert.equal(damaged.damageEvents.length, 1);
assert.deepEqual(damaged.killEvents, []);
assert.equal(
  damaged.matchup.mapPlacements.find((p) => p.id === 'target')?.combatState?.health,
  89.8,
);

const lethal = snapshotWithDamageEventAppended(snapshot(), {
  id: 'lethal-damage',
  time: 7,
  targetPlacementId: 'target',
  rawDamage: 200,
  source: {
    type: 'ability',
    abilityId: 'sova-shock-bolt',
    casterPlacementId: 'caster',
    deploymentId: 'ability-lethal',
  },
});

assert.deepEqual(lethal.killEvents, [
  {
    killerPlacementId: 'caster',
    victimPlacementId: 'target',
    source: {
      type: 'damage',
      damageEventId: 'lethal-damage',
      deploymentId: 'ability-lethal',
    },
  },
]);
assert.equal(lethal.matchup.mapPlacements.find((p) => p.id === 'target')?.eliminated, true);
assert.equal(
  lethal.matchup.mapPlacements.find((p) => p.id === 'target')?.eliminatedByPlacementId,
  'caster',
);

const removedLethal = removeDamageEventsForAbilityDeploymentFromSnapshot(
  lethal,
  'ability-lethal',
);

assert.deepEqual(removedLethal.damageEvents, []);
assert.deepEqual(removedLethal.killEvents, []);
assert.equal(removedLethal.matchup.mapPlacements.find((p) => p.id === 'target')?.eliminated, false);

const damagedTwice = snapshotWithDamageEventAppended(damaged, {
  id: 'damage-2',
  time: 6,
  targetPlacementId: 'target',
  rawDamage: 20,
  source: {
    type: 'ability',
    abilityId: 'brimstone-incendiary',
    casterPlacementId: 'caster',
    deploymentId: 'ability-2',
  },
});

const removedFirst = removeDamageEventsForAbilityDeploymentFromSnapshot(
  damagedTwice,
  'ability-1',
);

assert.deepEqual(
  removedFirst.damageEvents.map((event) => event.id),
  ['damage-2'],
);
assert.equal(
  removedFirst.matchup.mapPlacements.find((p) => p.id === 'target')?.combatState?.health,
  93.2,
);
assert.equal(
  removedFirst.matchup.mapPlacements.find((p) => p.id === 'target')?.combatState?.armor,
  11.8,
);
