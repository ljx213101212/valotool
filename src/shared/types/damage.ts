export type ArmorKind = 'none' | 'light' | 'regen' | 'heavy';

export type DamageSource =
  | {
      type: 'ability';
      abilityId: string;
      casterPlacementId: string;
      deploymentId?: string;
    }
  | {
      type: 'weapon';
      weaponId: string;
      hitRegion?: 'head' | 'body' | 'leg';
    }
  | {
      type: 'environment';
      kind: 'fall' | 'out-of-bounds' | 'map-hazard';
    };

export type DamageEvent = {
  id: string;
  time: number;
  targetPlacementId: string;
  rawDamage: number;
  source: DamageSource;
};

export type CombatState = {
  health: number;
  maxHealth: number;
  armorKind: ArmorKind;
  armor: number;
  maxArmor: number;
  regenPool?: number;
  lastDamageAt?: number;
  eliminated: boolean;
};

export type RegenArmorRecoveryConfig = {
  delaySec: number;
  ratePerSec: number;
};
