import type { TimelineKeyframeEntry } from '@/shared/types/timelineKeyframe';
import { applyTimelineKeyframeSnapshot } from '@/shared/utils/timelineKeyframeSnapshot';
import { timelineTimesEqualStep } from '@/shared/utils/timelineQuantize';

/** seek / 拖拽吸附后：若播放头落在某一关键帧刻度上，恢复快照 */
export function applyKeyframeSnapshotIfOnMarker(
  playheadTime: number,
  maxTime: number,
  keyframes: TimelineKeyframeEntry[]
): void {
  const hit = keyframes.find((k) => timelineTimesEqualStep(k.time, playheadTime, maxTime));
  if (hit) applyTimelineKeyframeSnapshot(hit.snapshot);
}

/**
 * 正向播放跨过硬切时刻：prevSec < k.time <= curSec 时应用该关键帧快照。
 * 同一帧跨过多个关键帧时应用时间上最后一条（最新状态）。
 */
export function applyPlaybackKeyframeCrossings(
  prevSec: number,
  curSec: number,
  keyframes: TimelineKeyframeEntry[]
): void {
  if (!keyframes.length || curSec <= prevSec + 1e-12) return;
  const crossed = keyframes
    .filter((k) => prevSec < k.time && curSec >= k.time - 1e-9)
    .sort((a, b) => a.time - b.time);
  if (!crossed.length) return;
  applyTimelineKeyframeSnapshot(crossed[crossed.length - 1].snapshot);
}
