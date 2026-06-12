/**
 * 图片 URL 约定（与 scripts/ingest-images.ts 的输出一致）：
 *   卡片大图  {CDN_BASE}/{点位id}/{role}.webp        （1600w）
 *   列表缩略图 {CDN_BASE}/{点位id}/{role}.thumb.webp  （480w）
 */
export const thumbUrl = (url: string) => url.replace(/\.webp$/, '.thumb.webp');
