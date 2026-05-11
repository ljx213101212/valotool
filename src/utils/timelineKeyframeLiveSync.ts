import type { TimelineKeyframeSnapshot } from '@/types/timelineKeyframe';
import { useMapSelectionStore } from '@/store/useMapSelectionStore';
import { useMatchupStore } from '@/store/useMatchupStore';
import { useTimelineKeyframeStore } from '@/store/timelineKeyframeStore';
import { useTimelinePlaybackStore } from '@/store/timelinePlaybackStore';
import { captureTimelineKeyframeSnapshot } from '@/utils/timelineKeyframeSnapshot';
import { quantizeTimelineSeconds, timelineTimesEqualStep } from '@/utils/timelineQuantize';

function keyframeSnapshotsEqual(a: TimelineKeyframeSnapshot, b: TimelineKeyframeSnapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** 暂停且播放头落在某一关键帧刻度上时，把当前阵容/地图状态写回该关键帧，避免之后 seek/播放再次套用旧快照。 */
function syncKeyframeSnapshotIfPlayheadOnMarker(): void {
  if (useTimelinePlaybackStore.getState().playing) return;

  const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
  const t = quantizeTimelineSeconds(currentTime, maxTime);
  const { keyframes } = useTimelineKeyframeStore.getState();
  const hit = keyframes.find((k) => timelineTimesEqualStep(k.time, t, maxTime));
  if (!hit) return;

  const snapshot = captureTimelineKeyframeSnapshot();
  if (keyframeSnapshotsEqual(snapshot, hit.snapshot)) return;

  useTimelineKeyframeStore.setState((s) => ({
    keyframes: s.keyframes.map((k) => (k.id === hit.id ? { ...k, snapshot } : k)),
  }));
}

/** 在应用入口调用一次：订阅阵容与地图选择变更以维护关键帧快照一致性 */
export function initTimelineKeyframeLiveSync(): void {
  useMatchupStore.subscribe(syncKeyframeSnapshotIfPlayheadOnMarker);
  useMapSelectionStore.subscribe(syncKeyframeSnapshotIfPlayheadOnMarker);
}
