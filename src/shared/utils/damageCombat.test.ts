import assert from 'node:assert/strict';
import {
  applyDamageToCombatState,
  createDefaultCombatState,
  deriveCombatStateAtTime,
  resolveRegenArmorAtTime,
} from './damageCombat';
import type { DamageEvent } from '@/shared/types/damage';

const abilitySource = {
  type: 'ability',
  abilityId: 'sova-shock-bolt',
  casterPlacementId: 'caster',
} as const;

assert.deepEqual(createDefaultCombatState('none'), {
  health: 100,
  maxHealth: 100,
  armorKind: 'none',
  armor: 0,
  maxArmor: 0,
  eliminated: false,
});

assert.deepEqual(createDefaultCombatState('light'), {
  health: 100,
  maxHealth: 100,
  armorKind: 'light',
  armor: 25,
  maxArmor: 25,
  eliminated: false,
});

assert.deepEqual(createDefaultCombatState('regen'), {
  health: 100,
  maxHealth: 100,
  armorKind: 'regen',
  armor: 25,
  maxArmor: 25,
  regenPool: 50,
  lastDamageAt: undefined,
  eliminated: false,
});

assert.deepEqual(
  applyDamageToCombatState(createDefaultCombatState('none'), {
    id: 'hit-1',
    time: 1,
    targetPlacementId: 'target',
    rawDamage: 30,
    source: abilitySource,
  }),
  {
    health: 70,
    maxHealth: 100,
    armorKind: 'none',
    armor: 0,
    maxArmor: 0,
    eliminated: false,
    lastDamageAt: 1,
  },
);

assert.deepEqual(
  applyDamageToCombatState(createDefaultCombatState('light'), {
    id: 'hit-2',
    time: 2,
    targetPlacementId: 'target',
    rawDamage: 30,
    source: abilitySource,
  }),
  {
    health: 89.8,
    maxHealth: 100,
    armorKind: 'light',
    armor: 5.2,
    maxArmor: 25,
    eliminated: false,
    lastDamageAt: 2,
  },
);

assert.deepEqual(
  applyDamageToCombatState(createDefaultCombatState('regen'), {
    id: 'hit-3',
    time: 3,
    targetPlacementId: 'target',
    rawDamage: 40,
    source: abilitySource,
  }),
  {
    health: 85,
    maxHealth: 100,
    armorKind: 'regen',
    armor: 0,
    maxArmor: 25,
    regenPool: 50,
    lastDamageAt: 3,
    eliminated: false,
  },
);

assert.equal(
  applyDamageToCombatState(createDefaultCombatState('heavy'), {
    id: 'hit-4',
    time: 4,
    targetPlacementId: 'target',
    rawDamage: 180,
    source: abilitySource,
  }).eliminated,
  true,
);

assert.deepEqual(
  resolveRegenArmorAtTime(
    {
      health: 85,
      maxHealth: 100,
      armorKind: 'regen',
      armor: 0,
      maxArmor: 25,
      regenPool: 50,
      lastDamageAt: 3,
      eliminated: false,
    },
    8,
    { delaySec: 2, ratePerSec: 10 },
  ),
  {
    health: 85,
    maxHealth: 100,
    armorKind: 'regen',
    armor: 25,
    maxArmor: 25,
    regenPool: 25,
    lastDamageAt: 3,
    eliminated: false,
  },
);

const events: DamageEvent[] = [
  {
    id: 'late',
    time: 10,
    targetPlacementId: 'target',
    rawDamage: 100,
    source: abilitySource,
  },
  {
    id: 'early',
    time: 2,
    targetPlacementId: 'target',
    rawDamage: 40,
    source: abilitySource,
  },
];

assert.equal(
  deriveCombatStateAtTime(createDefaultCombatState('none'), events, 5).health,
  60,
);

assert.equal(
  deriveCombatStateAtTime(createDefaultCombatState('none'), events, 10).eliminated,
  true,
);
