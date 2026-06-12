import type { ImageRole, Side, Site, Technique, Tier } from './schema';

/** 各枚举的中文展示文案（小程序/H5/后台共用） */

export const SIDE_LABELS: Record<Side, string> = {
  attack: '进攻',
  defense: '防守',
};

export const SITE_LABELS: Record<Site, string> = {
  A: 'A点',
  B: 'B点',
  C: 'C点',
  mid: '中路',
};

export const TIER_LABELS: Record<Tier, string> = {
  'must-learn': '必学',
  advanced: '进阶',
  flashy: '花活',
};

export const TECHNIQUE_LABELS: Record<Technique, string> = {
  stand: '站立释放',
  crouch: '蹲下释放',
  'jump-throw': '跳投',
  'run-jump-throw': '跑跳投',
  'hold-jump-throw': '长按跳投',
  'walk-throw': '走动释放',
  placed: '原地放置',
};

export const IMAGE_ROLE_LABELS: Record<ImageRole, string> = {
  stand: '站哪',
  aim: '瞄哪',
  effect: '落点效果',
};
