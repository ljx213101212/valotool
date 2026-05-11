import {
  TIMELINE_STEP_SECONDS,
  TIMELINE_TOTAL_SECONDS,
} from '@/constants/timeline';

/** 将时间对齐到时间轴网格（默认 100ms），并限制在 [0, maxTime] */
export function quantizeTimelineSeconds(seconds: number, maxTime: number): number {
  const step = TIMELINE_STEP_SECONDS;
  const clamped = Math.max(0, Math.min(maxTime, seconds));
  const tick = Math.round(clamped / step);
  const maxTick = Math.round(maxTime / step);
  const t = Math.min(maxTick, Math.max(0, tick)) * step;
  return Number(t.toFixed(4));
}

export function timelineTimeToTick(seconds: number, maxTime: number): number {
  return Math.round(quantizeTimelineSeconds(seconds, maxTime) / TIMELINE_STEP_SECONDS);
}

export function timelineTimesEqualStep(
  a: number,
  b: number,
  maxTime: number = TIMELINE_TOTAL_SECONDS
): boolean {
  return quantizeTimelineSeconds(a, maxTime) === quantizeTimelineSeconds(b, maxTime);
}

/** 用于 UI：显示为 m:ss.d（d 为十分之一秒） */
export function formatTimelineQuantized(seconds: number, maxTime: number): string {
  const q = quantizeTimelineSeconds(seconds, maxTime);
  const totalTenths = Math.round(q * 10);
  const m = Math.floor(totalTenths / 600);
  const rem = totalTenths % 600;
  const s = Math.floor(rem / 10);
  const tenth = rem % 10;
  return `${m}:${String(s).padStart(2, '0')}.${tenth}`;
}
