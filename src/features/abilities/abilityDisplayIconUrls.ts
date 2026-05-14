/**
 * 将 `displayIcon`（相对 `src/assets/abilities/`，如 `sova/Ability1.png`）解析为构建后可用的 URL。
 */
const pngModules = import.meta.glob<string>('@/assets/abilities/**/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
});

const DISPLAY_ICON_TO_URL: Record<string, string> = {};

for (const [filePath, href] of Object.entries(pngModules)) {
  const normalized = filePath.replace(/\\/g, '/');
  const needle = 'abilities/';
  const i = normalized.lastIndexOf(needle);
  if (i === -1) continue;
  const rel = normalized.slice(i + needle.length);
  DISPLAY_ICON_TO_URL[rel] = href;
}

export function getAbilityDisplayIconUrl(displayIcon: string): string | undefined {
  return DISPLAY_ICON_TO_URL[displayIcon];
}
