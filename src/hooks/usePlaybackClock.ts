import { useCallback, useEffect, useRef, useState } from 'react';

export type UsePlaybackClockParams = {
  currentTime: number;
  setCurrentTime: (seconds: number) => void;
  /** 播放进度上限（秒），与时间轴总时长一致时传入 */
  maxTime?: number;
};

export type UsePlaybackClockResult = {
  playing: boolean;
  togglePlay: () => void;
};

/**
 * 在父组件中集中维护播放时钟（rAF + 累计时间），保证 currentTime 单一数据源。
 * 通过 lastEmit 与 props 对比区分「本 hook 的 tick」与「外部 seek」，避免每帧重置 segment。
 */
export function usePlaybackClock({
  currentTime,
  setCurrentTime,
  maxTime,
}: UsePlaybackClockParams): UsePlaybackClockResult {
  const [playing, setPlaying] = useState(false);

  const accumulatedMsRef = useRef(0);
  const segmentStartPerfRef = useRef(0);
  const rafRef = useRef(0);
  const playingRef = useRef(false);
  const lastEmitRef = useRef<number | null>(null);

  const setCurrentTimeRef = useRef(setCurrentTime);
  setCurrentTimeRef.current = setCurrentTime;

  const maxTimeRef = useRef(maxTime);
  maxTimeRef.current = maxTime;

  /** 外部或 scrub 导致 props 变化时，对齐内部累计毫秒 */
  useEffect(() => {
    const echo =
      lastEmitRef.current != null &&
      Math.abs(currentTime - lastEmitRef.current) < 2e-3;
    if (echo) return;

    lastEmitRef.current = null;
    accumulatedMsRef.current = currentTime * 1000;
    if (playingRef.current) {
      segmentStartPerfRef.current = performance.now();
    }
  }, [currentTime]);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== 0) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const tick = useCallback(() => {
    if (!playingRef.current) return;
    const now = performance.now();
    const elapsedMs = accumulatedMsRef.current + (now - segmentStartPerfRef.current);
    let elapsedSec = elapsedMs / 1000;
    const cap = maxTimeRef.current;
    if (cap != null) {
      elapsedSec = Math.max(0, Math.min(cap, elapsedSec));
    }
    lastEmitRef.current = elapsedSec;
    setCurrentTimeRef.current(elapsedSec);
    if (playingRef.current) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, []);

  useEffect(() => {
    return () => {
      playingRef.current = false;
      stopLoop();
    };
  }, [stopLoop]);

  const togglePlay = useCallback(() => {
    if (playingRef.current) {
      playingRef.current = false;
      const now = performance.now();
      accumulatedMsRef.current += now - segmentStartPerfRef.current;
      stopLoop();
      setPlaying(false);
      return;
    }
    playingRef.current = true;
    segmentStartPerfRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    setPlaying(true);
  }, [stopLoop, tick]);

  return { playing, togglePlay };
}
