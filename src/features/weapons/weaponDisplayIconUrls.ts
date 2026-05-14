/**
 * 将 `displayIcon`（相对 `src/assets/weapons/`，如 `sidearms/classic.png`）解析为构建后可用的 URL。
 * 使用 glob + ?url，避免 `new URL(..., import.meta.url)` 在产物中指向错误目录导致图片 404。
 */
const pngModules = import.meta.glob<string>('@/assets/weapons/**/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
});

const DISPLAY_ICON_TO_URL: Record<string, string> = {};

for (const [filePath, href] of Object.entries(pngModules)) {
  const normalized = filePath.replace(/\\/g, '/');
  const needle = 'weapons/';
  const i = normalized.lastIndexOf(needle);
  if (i === -1) continue;
  const rel = normalized.slice(i + needle.length);
  DISPLAY_ICON_TO_URL[rel] = href;
}

export function getWeaponDisplayIconUrl(displayIcon: string): string | undefined {
  return DISPLAY_ICON_TO_URL[displayIcon];
}
