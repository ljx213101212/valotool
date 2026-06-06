import assert from 'node:assert/strict';
import { removePlacementFromSnapshot, snapshotWithAbilityDeployAppended } from './timelineAbilityMutations';
import type { TimelineKeyframeSnapshot } from '@/shared/types/timelineKeyframe';

const snapshot: TimelineKeyframeSnapshot = {
  matchup: {
    attackAgentIds: ['sova'],
    defenseAgentIds: ['jett'],
    dragDropTargetSide: 'attack',
    mapPlacements: [],
    abilityPlacements: [
      {
        id: 'ability-1',
        ownerPlacementId: 'caster',
        agentId: 'sova',
        abilitySlot: 'Ability1',
        x: 0,
        y: 0,
        state: 'active',
        placedAt: 0,
      },
    ],
  },
  mapSelection: {
    selectedMapId: 'split',
    side: 'attack',
  },
  killEvents: [],
  abilityDeployEvents: [
    {
      abilityPlacementId: 'ability-1',
      ownerPlacementId: 'caster',
      agentId: 'sova',
      abilitySlot: 'Ability1',
      phase: 'instant',
    },
  ],
  damageEvents: [
    {
      id: 'damage-1',
      time: 5,
      targetPlacementId: 'target',
      rawDamage: 75,
      source: {
        type: 'ability',
        abilityId: 'sova-shock-bolt',
        casterPlacementId: 'caster',
        deploymentId: 'ability-1',
      },
    },
  ],
};

const next = removePlacementFromSnapshot(snapshot, 'ability-1');

assert.deepEqual(next.matchup.abilityPlacements, []);
assert.deepEqual(next.abilityDeployEvents, []);
assert.deepEqual(next.damageEvents, []);

const instantSnapshot = snapshotWithAbilityDeployAppended(
  {
    ...snapshot,
    matchup: {
      ...snapshot.matchup,
      abilityPlacements: [
        {
          id: 'ability-2',
          ownerPlacementId: 'caster',
          agentId: 'sova',
          abilitySlot: 'Ability1',
          x: 0,
          y: 0,
          state: 'initial',
          placedAt: 0,
        },
      ],
    },
    abilityDeployEvents: [],
    damageEvents: [],
  },
  {
    abilityPlacementId: 'ability-2',
    ownerPlacementId: 'caster',
    agentId: 'sova',
    abilitySlot: 'Ability1',
    phase: 'instant',
  },
  5,
);

assert.equal(instantSnapshot.matchup.abilityPlacements[0].state, 'expired');
assert.equal(instantSnapshot.matchup.abilityPlacements[0].activeAt, 5);
