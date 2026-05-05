import { create } from 'zustand';
import { TIMELINE_TOTAL_SECONDS } from '../constants/timeline';

export type TimelinePlaybackState = {
  currentTime: number;
  playing: boolean;
  maxTime: number;
  seek: (seconds: number) => void;
  togglePlay: () => void;
};

let accumulatedMsRef = 0;
let segmentStartPerfRef = 0;
let rafRef = 0;
/** 与 rAF 同源，避免暂停后仍排队下一帧 */
let playingRef = false;

function clampTime(seconds: number, maxTime: number) {
  return Math.max(0, Math.min(maxTime, seconds));
}

function stopRaf() {
  if (rafRef !== 0) {
    cancelAnimationFrame(rafRef);
    rafRef = 0;
  }
}

export const useTimelinePlaybackStore = create<TimelinePlaybackState>((set, get) => {
  const tick = () => {
    if (!playingRef) return;
    const now = performance.now();
    const elapsedMs = accumulatedMsRef + (now - segmentStartPerfRef);
    const maxTime = get().maxTime;
    const elapsedSec = clampTime(elapsedMs / 1000, maxTime);
    set({ currentTime: elapsedSec });
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
      const t = clampTime(seconds, maxTime);
      accumulatedMsRef = t * 1000;
      if (playingRef) {
        segmentStartPerfRef = performance.now();
      }
      set({ currentTime: t });
    },

    togglePlay: () => {
      if (playingRef) {
        playingRef = false;
        const now = performance.now();
        accumulatedMsRef += now - segmentStartPerfRef;
        stopRaf();
        set({ playing: false });
        return;
      }
      playingRef = true;
      segmentStartPerfRef = performance.now();
      set({ playing: true });
      rafRef = requestAnimationFrame(tick);
    },
  };
});
