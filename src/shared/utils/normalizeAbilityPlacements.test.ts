import assert from 'node:assert/strict';
import { normalizeAbilityPlacements } from './normalizeAbilityPlacements';

const [placement] = normalizeAbilityPlacements([
  {
    id: 'flash-1',
    ownerPlacementId: 'caster-1',
    agentId: 'kayo',
    abilitySlot: 'Ability1',
    x: 10,
    y: 20,
    state: 'active',
    placedAt: 1000,
    activeAt: 5,
    expiresAt: 8,
    statusEffect: {
      kind: 'flash',
      sourceX: 12,
      sourceY: 24,
      radius: 80,
    },
    affectedStatuses: [
      {
        targetPlacementId: 'enemy-1',
        effect: 'flash',
        severity: 'front',
        strength: 0.9,
        startsAt: 5,
        endsAt: 7,
        fadeEndsAt: 8,
      },
      {
        targetPlacementId: 'enemy-2',
        effect: 'flash',
        severity: 'bogus',
        strength: 3,
        startsAt: 5,
        endsAt: 7,
        fadeEndsAt: 8,
      },
    ],
  },
]);

assert.equal(placement.statusEffect?.kind, 'flash');
assert.equal(placement.statusEffect?.sourceX, 12);
assert.equal(placement.affectedStatuses?.length, 1);
assert.equal(placement.affectedStatuses?.[0]?.targetPlacementId, 'enemy-1');
assert.equal(placement.affectedStatuses?.[0]?.severity, 'front');
