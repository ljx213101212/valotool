import type { ArmorId } from '../config';

export const armorLabelsZh = {
  light: '轻甲',
  regen: '再生护甲',
  heavy: '重甲',
} as const satisfies Record<ArmorId, string>;
