import assert from 'node:assert/strict';
import { reconcileMapPlacements } from './reconcileMapPlacements';

const placements = reconcileMapPlacements(['sova'], ['jett'], []);

assert.equal(placements.length, 2);
assert.equal(placements[0].initialCombatState?.health, 100);
assert.equal(placements[0].initialCombatState?.armorKind, 'none');
assert.deepEqual(placements[0].combatState, placements[0].initialCombatState);

const preserved = reconcileMapPlacements(['sova'], ['jett'], [
  {
    ...placements[0],
    combatState: {
      health: 60,
      maxHealth: 100,
      armorKind: 'none',
      armor: 0,
      maxArmor: 0,
      eliminated: false,
    },
  },
]);

assert.equal(preserved[0].combatState?.health, 60);
