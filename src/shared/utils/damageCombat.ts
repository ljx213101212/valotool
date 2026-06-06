import type {
  ArmorKind,
  CombatState,
  DamageEvent,
  RegenArmorRecoveryConfig,
} from '@/shared/types/damage';

const BASE_HEALTH = 100;
const ARMOR_CONFIG = {
  none: { maxArmor: 0, absorption: 0, regenPool: undefined },
  light: { maxArmor: 25, absorption: 0.66, regenPool: undefined },
  regen: { maxArmor: 25, absorption: 1, regenPool: 50 },
  heavy: { maxArmor: 50, absorption: 0.66, regenPool: undefined },
} as const satisfies Record<
  ArmorKind,
  { maxArmor: number; absorption: number; regenPool: number | undefined }
>;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundDamageValue(value: number): number {
  return Math.round(value * 100) / 100;
}

export function createDefaultCombatState(armorKind: ArmorKind): CombatState {
  const config = ARMOR_CONFIG[armorKind];
  return {
    health: BASE_HEALTH,
    maxHealth: BASE_HEALTH,
    armorKind,
    armor: config.maxArmor,
    maxArmor: config.maxArmor,
    ...(config.regenPool != null
      ? { regenPool: config.regenPool, lastDamageAt: undefined }
      : {}),
    eliminated: false,
  };
}

export function applyDamageToCombatState(
  state: CombatState,
  event: DamageEvent,
): CombatState {
  if (state.eliminated || event.rawDamage <= 0) return state;

  const absorption = ARMOR_CONFIG[state.armorKind].absorption;
  const desiredArmorDamage = event.rawDamage * absorption;
  const armorDamage = Math.min(state.armor, desiredArmorDamage);
  const healthDamage = event.rawDamage - armorDamage;
  const nextHealth = roundDamageValue(clamp(state.health - healthDamage, 0, state.maxHealth));
  const nextArmor = roundDamageValue(clamp(state.armor - armorDamage, 0, state.maxArmor));

  return {
    ...state,
    health: nextHealth,
    armor: nextArmor,
    lastDamageAt: event.time,
    eliminated: nextHealth <= 0,
  };
}

export function resolveRegenArmorAtTime(
  state: CombatState,
  playheadSec: number,
  config: RegenArmorRecoveryConfig,
): CombatState {
  if (
    state.armorKind !== 'regen' ||
    state.eliminated ||
    state.lastDamageAt == null ||
    state.regenPool == null ||
    state.regenPool <= 0 ||
    state.armor >= state.maxArmor
  ) {
    return state;
  }

  const elapsedAfterDelay = playheadSec - state.lastDamageAt - config.delaySec;
  if (elapsedAfterDelay <= 0 || config.ratePerSec <= 0) return state;

  const missingArmor = state.maxArmor - state.armor;
  const recovered = roundDamageValue(
    Math.min(missingArmor, state.regenPool, elapsedAfterDelay * config.ratePerSec),
  );

  return {
    ...state,
    armor: roundDamageValue(state.armor + recovered),
    regenPool: roundDamageValue(state.regenPool - recovered),
  };
}

export function deriveCombatStateAtTime(
  initialState: CombatState,
  events: DamageEvent[],
  playheadSec: number,
  regenConfig?: RegenArmorRecoveryConfig,
): CombatState {
  const ordered = [...events]
    .filter((event) => event.time <= playheadSec)
    .sort((a, b) => a.time - b.time);

  let state = initialState;
  for (const event of ordered) {
    if (regenConfig) {
      state = resolveRegenArmorAtTime(state, event.time, regenConfig);
    }
    state = applyDamageToCombatState(state, event);
  }

  return regenConfig ? resolveRegenArmorAtTime(state, playheadSec, regenConfig) : state;
}
