import type { WeaponId } from '../config';

/** 武器展示名（中文），与 Valorant 常用译名对齐。 */
export const weaponLabelsZh = {
  classic: '标配',
  shorty: '短炮',
  frenzy: '狂怒',
  ghost: '鬼魅',
  sheriff: '正义',
  bandit: '追猎',
  ares: '战神',
  odin: '奥丁',
  bulldog: '獠犬',
  guardian: '戍卫',
  phantom: '幻影',
  vandal: '狂徒',
  bucky: '雄鹿',
  judge: '判官',
  spectre: '骇灵',
  stinger: '蜂刺',
  marshal: '飞将',
  operator: '冥驹',
  outlaw: '莽侠',
} as const satisfies Record<WeaponId, string>;
