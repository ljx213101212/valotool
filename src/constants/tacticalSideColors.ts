import type { MatchupSide } from '@/types/matchup';

/**
 * 攻方 / 守方语义色（与 `tacticalSideColors.less`、各面板标题一致：攻红、守蓝）。
 * 改色请同时更新 Less 变量。
 */
const ATTACK_TITLE_RGB = [252, 165, 165] as const;
const DEFENSE_TITLE_RGB = [125, 211, 252] as const;

function rgba(rgb: readonly [number, number, number], alpha: number) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function rgbToHex(rgb: readonly [number, number, number]) {
  return (
    '#' +
    rgb
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')
  );
}

/** 攻方强调（标题 / 地图 token 描边等） */
export const TACTICAL_ATTACK_ACCENT = rgbToHex(ATTACK_TITLE_RGB);
/** 守方强调 */
export const TACTICAL_DEFENSE_ACCENT = rgbToHex(DEFENSE_TITLE_RGB);

/** 地图 token 视野扇形填充 */
export const TACTICAL_ATTACK_MAP_TOKEN_FILL = rgba(ATTACK_TITLE_RGB, 0.38);
export const TACTICAL_DEFENSE_MAP_TOKEN_FILL = rgba(DEFENSE_TITLE_RGB, 0.38);

export function tacticalSideMapTokenColors(side: MatchupSide) {
  return side === 'attack'
    ? { accent: TACTICAL_ATTACK_ACCENT, wedgeFill: TACTICAL_ATTACK_MAP_TOKEN_FILL }
    : { accent: TACTICAL_DEFENSE_ACCENT, wedgeFill: TACTICAL_DEFENSE_MAP_TOKEN_FILL };
}
