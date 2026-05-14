/** 相对 `src/assets/weapons/` 的路径；展示文案见 `localization/`。 */
function weaponAsset(dir: string, base: string, price: number) {
  const prefix = dir ? `${dir}/` : '';
  return {
    name: base,
    svg: `${prefix}${base}.svg`,
    displayIcon: `${prefix}${base}.png`,
    displayIconMirror: `${prefix}${base}_mirror.png`,
    type: dir,
    price,
  } as const;
}

/** `sidearms/` 下的手枪类（顺序接近游戏内购买栏）。 */
const SIDEARMS = [
  weaponAsset('sidearms', 'classic', 0),
  weaponAsset('sidearms', 'shorty', 300),
  weaponAsset('sidearms', 'frenzy', 450),
  weaponAsset('sidearms', 'ghost', 500),
  weaponAsset('sidearms', 'sheriff', 800),
  weaponAsset('sidearms', 'bandit', 600),
] as const;

/** 除 `sidearms/` 外各子目录下的长枪等（与仓库内 SVG 一一对应）。 */
const PRIMARY_WEAPONS = [

  // 第一列
  weaponAsset('smgs', 'stinger', 950),
  weaponAsset('smgs', 'spectre', 1600),
  weaponAsset('shotguns', 'bucky', 850),
  weaponAsset('shotguns', 'judge', 1850),

  // 第二列
  weaponAsset('riffles', 'bulldog', 2050),
  weaponAsset('riffles', 'guardian', 2250),
  weaponAsset('riffles', 'phantom', 2900),
  weaponAsset('riffles', 'vandal', 2900),

  // 第三列：上三格狙击（总高=第一列前两格）；下两格机枪，单格高度与第一、二列相同
  weaponAsset('snipers', 'marshal', 950),
  weaponAsset('snipers', 'outlaw', 2400),
  weaponAsset('snipers', 'operator', 4700),
  weaponAsset('heavies', 'ares', 1600),
  weaponAsset('heavies', 'odin', 3200),
 
] as const;

const ARMOR = [
  weaponAsset('armor', 'light', 400),
  weaponAsset('armor', 'regen', 650),
  weaponAsset('armor', 'heavy', 1000),
] as const;

export type Sidearm = (typeof SIDEARMS)[number];
export type PrimaryWeapon = (typeof PRIMARY_WEAPONS)[number];
export type ArmorItem = (typeof ARMOR)[number];
export type WeaponConfig = Sidearm | PrimaryWeapon;

export { ARMOR, SIDEARMS, PRIMARY_WEAPONS };

/** 护甲 id，与 `getArmorLabel`、资源 `armor/{id}.png` 一致。 */
export type ArmorId = (typeof ARMOR)[number]['name'];

export const ALL_WEAPONS = [...SIDEARMS, ...PRIMARY_WEAPONS] as const;
export type AllWeapon = (typeof ALL_WEAPONS)[number];

/** 稳定 id，与资源文件名、`getWeaponLabel(locale, id)` 的键一致。 */
export type WeaponId = (typeof ALL_WEAPONS)[number]['name'];
