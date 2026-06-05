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
      impactPoints: [
        { x: 12, y: 24 },
        { x: 32, y: 44 },
      ],
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
assert.equal(placement.statusEffect?.impactPoints?.length, 2);
assert.equal(placement.affectedStatuses?.length, 1);
assert.equal(placement.affectedStatuses?.[0]?.targetPlacementId, 'enemy-1');
assert.equal(placement.affectedStatuses?.[0]?.severity, 'front');

const [projectilePlacement] = normalizeAbilityPlacements([
  {
    id: 'relay-1',
    ownerPlacementId: 'neon-1',
    agentId: 'neon',
    abilitySlot: 'Ability1',
    x: 50,
    y: 60,
    state: 'active',
    placedAt: 1000,
    projectilePath: {
      segments: [
        {
          from: { x: 0, y: 0 },
          to: { x: 20, y: 0 },
        },
        {
          from: { x: 20, y: 0 },
          to: { x: 35, y: 15 },
        },
      ],
      hits: [
        {
          wallId: 'wall-1',
          point: { x: 20, y: 0 },
        },
      ],
      terminal: { x: 35, y: 15 },
    },
  },
]);

assert.equal(projectilePlacement.projectilePath?.segments.length, 2);
assert.equal(projectilePlacement.projectilePath?.hits[0]?.wallId, 'wall-1');
assert.deepEqual(projectilePlacement.projectilePath?.terminal, { x: 35, y: 15 });
