import type { TimelineKeyframeEntry } from '@/shared/types/timelineKeyframe';
import { TIMELINE_KEYFRAME_SNAP_WINDOW_SECONDS } from '@/shared/constants/timeline';
import { convertPixelsToSeconds } from '@/shared/utils/convert';
import { quantizeTimelineSeconds } from '@/shared/utils/timelineQuantize';

/**
 * 指针位置 → 量化时间；若与某关键帧时间差 ≤ 吸附窗口（默认 100ms），则吸附到该关键帧。
 * 若窗口内多个候选，取时间差最小者。
 */
export function snapPointerToNearestKeyframe(
  xPx: number,
  keyframes: TimelineKeyframeEntry[],
  args: {
    totalDuration: number;
    pixelsPerSecond: number;
    contentWidth: number;
  }
): { xPx: number; seconds: number } {
  const { totalDuration, pixelsPerSecond, contentWidth } = args;
  let x = xPx;
  if (x < 0) x = 0;
  if (x > contentWidth) x = contentWidth;

  const rawSeconds = Math.max(
    0,
    Math.min(totalDuration, convertPixelsToSeconds(x, pixelsPerSecond))
  );
  const quantized = quantizeTimelineSeconds(rawSeconds, totalDuration);

  let best: { dt: number; kf: TimelineKeyframeEntry } | null = null;
  const win = TIMELINE_KEYFRAME_SNAP_WINDOW_SECONDS;
  for (const kf of keyframes) {
    const dt = Math.abs(quantized - kf.time);
    if (dt <= win + 1e-9 && (!best || dt < best.dt - 1e-9)) {
      best = { dt, kf };
    }
  }

  if (best) {
    const t = quantizeTimelineSeconds(best.kf.time, totalDuration);
    return { xPx: t * pixelsPerSecond, seconds: t };
  }

  const qPx = quantized * pixelsPerSecond;
  return { xPx: qPx, seconds: quantized };
}
