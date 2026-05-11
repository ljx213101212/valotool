import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { TIMELINE_TOTAL_SECONDS } from '../constants/timeline';
import {
  applyKeyframeSnapshotIfOnMarker,
  applyPlaybackKeyframeCrossings,
} from '@/utils/timelineKeyframePlaybackSync';
import type { TimelineKeyframeEntry } from '@/types/timelineKeyframe';
import { quantizeTimelineSeconds } from '../utils/timelineQuantize';

export type TimelinePlaybackState = {
  currentTime: number;
  playing: boolean;
  maxTime: number;
  seek: (seconds: number) => void;
  togglePlay: () => void;
  /** 暂停播放（用于关键帧跳转等，停在当前时间） */
  pausePlayback: () => void;
};

let accumulatedMsRef = 0;
let segmentStartPerfRef = 0;
let rafRef = 0;
/** 与 rAF 同源，避免暂停后仍排队下一帧 */
let playingRef = false;
/** 上一帧播放时间，用于检测跨过关键帧 */
let playbackPrevSecRef = 0;

/** 由 timelineKeyframeStore 注册，避免 playback ↔ keyframe store 循环依赖 */
let getKeyframesForPlayback: () => TimelineKeyframeEntry[] = () => [];

export function registerTimelinePlaybackKeyframesSource(fn: () => TimelineKeyframeEntry[]) {
  getKeyframesForPlayback = fn;
}

function clampTime(seconds: number, maxTime: number) {
  return Math.max(0, Math.min(maxTime, seconds));
}

function stopRaf() {
  if (rafRef !== 0) {
    cancelAnimationFrame(rafRef);
    rafRef = 0;
  }
}

export const useTimelinePlaybackStore = create<TimelinePlaybackState>()(
  devtools(
    (set, get) => {
      const pausePlaybackInternal = () => {
        if (!playingRef) return;
        playingRef = false;
        const now = performance.now();
        accumulatedMsRef += now - segmentStartPerfRef;
        stopRaf();
        set({ playing: false });
        playbackPrevSecRef = get().currentTime;
      };

      const tick = () => {
        if (!playingRef) return;
        const now = performance.now();
        const elapsedMs = accumulatedMsRef + (now - segmentStartPerfRef);
        const maxTime = get().maxTime;
        const curSec = clampTime(elapsedMs / 1000, maxTime);
        const prevSec = playbackPrevSecRef;
        applyPlaybackKeyframeCrossings(prevSec, curSec, getKeyframesForPlayback());
        playbackPrevSecRef = curSec;
        set({ currentTime: curSec });
        if (playingRef) {
          rafRef = requestAnimationFrame(tick);
        }
      };

      return {
        currentTime: 0,
        playing: false,
        maxTime: TIMELINE_TOTAL_SECONDS,

        seek: (seconds: number) => {
          const maxTime = get().maxTime;
          const t = quantizeTimelineSeconds(clampTime(seconds, maxTime), maxTime);
          accumulatedMsRef = t * 1000;
          if (playingRef) {
            segmentStartPerfRef = performance.now();
          }
          playbackPrevSecRef = t;
          set({ currentTime: t });
          applyKeyframeSnapshotIfOnMarker(t, maxTime, getKeyframesForPlayback());
        },

        pausePlayback: () => {
          pausePlaybackInternal();
        },

        togglePlay: () => {
          if (playingRef) {
            pausePlaybackInternal();
            return;
          }
          playingRef = true;
          playbackPrevSecRef = get().currentTime;
          segmentStartPerfRef = performance.now();
          applyKeyframeSnapshotIfOnMarker(
            get().currentTime,
            get().maxTime,
            getKeyframesForPlayback()
          );
          set({ playing: true });
          rafRef = requestAnimationFrame(tick);
        },
      };
    },
    { name: 'TimelinePlaybackStore', enabled: import.meta.env.DEV }
  )
);
