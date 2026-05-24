/** 将视口指针坐标转换为 Konva Stage 本地坐标（已计入 CSS 缩放与平移）。 */
export function clientPointToMapStage(
  stage: { width: () => number; height: () => number; container: () => HTMLElement },
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  const el = stage.container();
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const x = ((clientX - rect.left) / rect.width) * stage.width();
  const y = ((clientY - rect.top) / rect.height) * stage.height();
  return { x, y };
}
