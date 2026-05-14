import type { WeaponId } from '../config';

/** Weapon display names (English); align with in-game displayName / API. */
export const weaponLabelsEn = {
  classic: 'Classic',
  shorty: 'Shorty',
  frenzy: 'Frenzy',
  ghost: 'Ghost',
  sheriff: 'Sheriff',
  bandit: 'Bandit',
  ares: 'Ares',
  odin: 'Odin',
  bulldog: 'Bulldog',
  guardian: 'Guardian',
  phantom: 'Phantom',
  vandal: 'Vandal',
  bucky: 'Bucky',
  judge: 'Judge',
  spectre: 'Spectre',
  stinger: 'Stinger',
  marshal: 'Marshal',
  operator: 'Operator',
  outlaw: 'Outlaw',
} as const satisfies Record<WeaponId, string>;
