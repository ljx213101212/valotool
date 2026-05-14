/** 相对 `src/assets/weapons/` 的文件名。 */
function weaponAsset(
  dir: string,
  base: string,
  price: number,
  labelZh?: string,
) {
  const prefix = dir ? `${dir}/` : '';
  return {
    name: base,
    svg: `${prefix}${base}.svg`,
    displayIcon: `${prefix}${base}.png`,
    displayIconMirror: `${prefix}${base}_mirror.png`,
    type: dir,
    price,
    labelZh: labelZh ?? base,
  } as const;
}

/** `sidearms/` 下的手枪类（顺序接近游戏内购买栏）。 */
const SIDEARMS = [
  weaponAsset('sidearms', 'classic', 0, '标配'),
  weaponAsset('sidearms', 'shorty', 300, '短炮'),
  weaponAsset('sidearms', 'frenzy', 450, '狂怒'),
  weaponAsset('sidearms', 'ghost', 500, '鬼魅'),
  weaponAsset('sidearms', 'sheriff', 800, '神射手'),
  weaponAsset('sidearms', 'bandit', 600, '劫匪'),
] as const;

/** 除 `sidearms/` 外各子目录下的长枪等（与仓库内 SVG 一一对应）。 */
const PRIMARY_WEAPONS = [
  weaponAsset('heavies', 'ares', 1600, '战神'),
  weaponAsset('heavies', 'odin', 3200, '奥丁'),
  weaponAsset('riffles', 'bulldog', 2050, '斗牛犬'),
  weaponAsset('riffles', 'guardian', 2250, '捍卫者'),
  weaponAsset('riffles', 'phantom', 2900, '幻影'),
  weaponAsset('riffles', 'vandal', 2900, '狂徒'),
  weaponAsset('shotguns', 'bucky', 850, '雄鹿'),
  weaponAsset('shotguns', 'judge', 1850, '判官'),
  weaponAsset('smgs', 'spectre', 1600, '骇灵'),
  weaponAsset('smgs', 'stinger', 950, '刺针'),
  weaponAsset('snipers', 'marshal', 950, '飞将'),
  weaponAsset('snipers', 'operator', 4700, '大狙'),
  weaponAsset('snipers', 'outlaw', 2400, '莽侠'),
] as const;

export type Sidearm = (typeof SIDEARMS)[number];
export type PrimaryWeapon = (typeof PRIMARY_WEAPONS)[number];
export type WeaponConfig = Sidearm | PrimaryWeapon;

export { SIDEARMS, PRIMARY_WEAPONS };

export const ALL_WEAPONS = [...SIDEARMS, ...PRIMARY_WEAPONS] as const;
export type AllWeapon = (typeof ALL_WEAPONS)[number];
