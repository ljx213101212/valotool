import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { TimelineKeyframeEntry } from '@/types/timelineKeyframe';
import {
  applyTimelineKeyframeSnapshot,
  captureTimelineKeyframeSnapshot,
} from '@/utils/timelineKeyframeSnapshot';
import { useTimelinePlaybackStore } from '@/store/timelinePlaybackStore';
import {
  quantizeTimelineSeconds,
  timelineTimeToTick,
  timelineTimesEqualStep,
} from '@/utils/timelineQuantize';

export type TimelineKeyframeState = {
  keyframes: TimelineKeyframeEntry[];
  /** 在当前播放头时间写入或覆盖一条关键帧 */
  addKeyframeAtCurrentTime: () => void;
  /** 删除当前播放头时间上的关键帧（时间与关键帧一致时） */
  removeKeyframeAtCurrentTime: () => void;
  seekToPrevKeyframe: () => void;
  seekToNextKeyframe: () => void;
};

function sortedKeyframes(entries: TimelineKeyframeEntry[]): TimelineKeyframeEntry[] {
  return [...entries].sort((a, b) => a.time - b.time);
}

export const useTimelineKeyframeStore = create<TimelineKeyframeState>()(
  devtools(
    (set, get) => ({
      keyframes: [],

      addKeyframeAtCurrentTime: () => {
        const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
        const t = quantizeTimelineSeconds(currentTime, maxTime);
        const snapshot = captureTimelineKeyframeSnapshot();
        set((s) => {
          const rest = s.keyframes.filter((k) => !timelineTimesEqualStep(k.time, t, maxTime));
          return { keyframes: sortedKeyframes([...rest, { time: t, snapshot }]) };
        });
      },

      removeKeyframeAtCurrentTime: () => {
        const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
        const t = quantizeTimelineSeconds(currentTime, maxTime);
        set((s) => ({
          keyframes: s.keyframes.filter((k) => !timelineTimesEqualStep(k.time, t, maxTime)),
        }));
      },

      seekToPrevKeyframe: () => {
        const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
        const sorted = sortedKeyframes(get().keyframes);
        const curTick = timelineTimeToTick(currentTime, maxTime);
        let target: TimelineKeyframeEntry | undefined;
        for (let i = sorted.length - 1; i >= 0; i--) {
          if (timelineTimeToTick(sorted[i].time, maxTime) < curTick) {
            target = sorted[i];
            break;
          }
        }
        if (!target) return;
        useTimelinePlaybackStore.getState().seek(target.time);
        applyTimelineKeyframeSnapshot(target.snapshot);
      },

      seekToNextKeyframe: () => {
        const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
        const sorted = sortedKeyframes(get().keyframes);
        const curTick = timelineTimeToTick(currentTime, maxTime);
        let target: TimelineKeyframeEntry | undefined;
        for (let i = 0; i < sorted.length; i++) {
          if (timelineTimeToTick(sorted[i].time, maxTime) > curTick) {
            target = sorted[i];
            break;
          }
        }
        if (!target) return;
        useTimelinePlaybackStore.getState().seek(target.time);
        applyTimelineKeyframeSnapshot(target.snapshot);
      },
    }),
    { name: 'TimelineKeyframeStore', enabled: import.meta.env.DEV }
  )
);

export function useKeyframeSkipAvailability(
  currentTime: number,
  maxTime: number
): {
  canPrev: boolean;
  canNext: boolean;
} {
  const keyframes = useTimelineKeyframeStore((s) => s.keyframes);
  const curTick = timelineTimeToTick(currentTime, maxTime);
  let canPrev = false;
  let canNext = false;
  for (let i = 0; i < keyframes.length; i++) {
    const kt = timelineTimeToTick(keyframes[i].time, maxTime);
    if (kt < curTick) canPrev = true;
    if (kt > curTick) canNext = true;
  }
  return { canPrev, canNext };
}

/** 播放头是否对齐某一关键帧（100ms 网格） */
export function usePlayheadAtKeyframe(currentTime: number, maxTime: number): boolean {
  const keyframes = useTimelineKeyframeStore((s) => s.keyframes);
  return keyframes.some((k) => timelineTimesEqualStep(k.time, currentTime, maxTime));
}
