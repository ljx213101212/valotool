import type { ArmorId } from '../config';

export const armorLabelsEn = {
  light: 'Light Armor',
  regen: 'Regen Shield',
  heavy: 'Heavy Armor',
} as const satisfies Record<ArmorId, string>;
