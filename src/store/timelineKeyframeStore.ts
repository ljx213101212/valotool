import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { TimelineKeyframeEntry } from '@/types/timelineKeyframe';
import { captureTimelineKeyframeSnapshot } from '@/utils/timelineKeyframeSnapshot';
import {
  registerTimelinePlaybackKeyframesSource,
  useTimelinePlaybackStore,
} from '@/store/timelinePlaybackStore';
import {
  quantizeTimelineSeconds,
  timelineTimeToTick,
  timelineTimesEqualStep,
} from '@/utils/timelineQuantize';

export type TimelineKeyframeState = {
  keyframes: TimelineKeyframeEntry[];
  /** 关键帧详情 Drawer 当前聚焦的关键帧 id */
  detailKeyframeId: string | null;
  /** 在当前播放头时间写入或覆盖一条关键帧 */
  addKeyframeAtCurrentTime: () => void;
  /** 删除当前播放头时间上的关键帧（时间与关键帧一致时） */
  removeKeyframeAtCurrentTime: () => void;
  /** 拖拽修改关键帧时间戳（100ms 网格，冲突则忽略） */
  moveKeyframeTime: (id: string, newTimeSeconds: number) => void;
  seekToPrevKeyframe: () => void;
  seekToNextKeyframe: () => void;
  openKeyframeDetail: (id: string) => void;
  closeKeyframeDetail: () => void;
};

function sortedKeyframes(entries: TimelineKeyframeEntry[]): TimelineKeyframeEntry[] {
  return [...entries].sort((a, b) => a.time - b.time);
}

export const useTimelineKeyframeStore = create<TimelineKeyframeState>()(
  devtools(
    (set, get) => ({
      keyframes: [],
      detailKeyframeId: null,

      openKeyframeDetail: (id: string) => set({ detailKeyframeId: id }),

      closeKeyframeDetail: () => set({ detailKeyframeId: null }),

      addKeyframeAtCurrentTime: () => {
        const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
        const t = quantizeTimelineSeconds(currentTime, maxTime);
        const snapshot = captureTimelineKeyframeSnapshot();
        set((s) => {
          const rest = s.keyframes.filter((k) => !timelineTimesEqualStep(k.time, t, maxTime));
          return {
            keyframes: sortedKeyframes([
              ...rest,
              { id: crypto.randomUUID(), time: t, snapshot },
            ]),
          };
        });
      },

      removeKeyframeAtCurrentTime: () => {
        const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
        const t = quantizeTimelineSeconds(currentTime, maxTime);
        set((s) => {
          const victim = s.keyframes.find((k) => timelineTimesEqualStep(k.time, t, maxTime));
          return {
            keyframes: s.keyframes.filter((k) => !timelineTimesEqualStep(k.time, t, maxTime)),
            detailKeyframeId:
              victim && victim.id === s.detailKeyframeId ? null : s.detailKeyframeId,
          };
        });
      },

      moveKeyframeTime: (id: string, newTimeSeconds: number) => {
        const maxTime = useTimelinePlaybackStore.getState().maxTime;
        const newT = quantizeTimelineSeconds(newTimeSeconds, maxTime);
        set((s) => {
          const idx = s.keyframes.findIndex((k) => k.id === id);
          if (idx < 0) return s;
          const others = s.keyframes.filter((k) => k.id !== id);
          if (others.some((k) => timelineTimesEqualStep(k.time, newT, maxTime))) {
            return s;
          }
          const cur = s.keyframes[idx];
          const merged = [...others, { ...cur, time: newT }];
          return { keyframes: sortedKeyframes(merged) };
        });
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
        useTimelinePlaybackStore.getState().pausePlayback();
        useTimelinePlaybackStore.getState().seek(target.time);
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
        useTimelinePlaybackStore.getState().pausePlayback();
        useTimelinePlaybackStore.getState().seek(target.time);
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

/** 播放头所在的关键帧条目（用于详情按钮） */
export function useKeyframeAtPlayhead(
  currentTime: number,
  maxTime: number
): TimelineKeyframeEntry | undefined {
  const keyframes = useTimelineKeyframeStore((s) => s.keyframes);
  return keyframes.find((k) => timelineTimesEqualStep(k.time, currentTime, maxTime));
}

registerTimelinePlaybackKeyframesSource(() => useTimelineKeyframeStore.getState().keyframes);
