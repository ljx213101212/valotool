import type { ArmorId, WeaponId } from '../config';
import { armorLabelsEn } from './armorEn';
import { armorLabelsZh } from './armorZh';
import { weaponLabelsEn } from './en';
import { weaponLabelsZh } from './zh';

export type WeaponLocale = 'zh' | 'en';

const weaponLabelsByLocale = {
  zh: weaponLabelsZh,
  en: weaponLabelsEn,
} as const;

const armorLabelsByLocale = {
  zh: armorLabelsZh,
  en: armorLabelsEn,
} as const;

export function getWeaponLabel(locale: WeaponLocale, id: WeaponId): string {
  return weaponLabelsByLocale[locale][id];
}

export function getArmorLabel(locale: WeaponLocale, id: ArmorId): string {
  return armorLabelsByLocale[locale][id];
}

/** 购买栏武器格 aria 用短后缀（避免整句 UI 文案混在武器模块时可再抽到 app i18n）。 */
export function weaponEquippedAriaSuffix(locale: WeaponLocale, equipped: boolean): string {
  if (!equipped) return '';
  return locale === 'zh' ? '（已装备）' : ' (equipped)';
}

export { armorLabelsEn, armorLabelsZh, weaponLabelsEn, weaponLabelsZh };

export type WeaponLabelsTable = Record<WeaponId, string>;

export function getWeaponLabelsTable(locale: WeaponLocale): WeaponLabelsTable {
  return weaponLabelsByLocale[locale];
}
