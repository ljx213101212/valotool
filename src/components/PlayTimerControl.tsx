import { useCallback, useEffect, useRef, useState } from 'react';
import './PlayTimerControl.less';

export type PlayTimerControlProps = {
  /** 每次动画帧回调当前累计时间（秒，浮点），便于之后驱动 TimelineArea */
  onTick?: (elapsedSeconds: number) => void;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00.000';
  const s = Math.floor(seconds % 60);
  const m = Math.floor(seconds / 60);
  const frac = seconds - Math.floor(seconds);
  const ms = Math.floor(frac * 1000);
  return `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

export function PlayTimerControl({ onTick }: PlayTimerControlProps) {
  const [playing, setPlaying] = useState(false);
  const [displaySeconds, setDisplaySeconds] = useState(0);

  const accumulatedMsRef = useRef(0);
  const segmentStartPerfRef = useRef(0);
  const rafRef = useRef(0);
  /** 与 rAF 同源的真实播放状态；避免 tick 末尾仍排队下一帧导致“暂停了还在跑” */
  const playingRef = useRef(false);
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

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
    const elapsedSec = elapsedMs / 1000;
    setDisplaySeconds(elapsedSec);
    onTickRef.current?.(elapsedSec);
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

  return (
    <div className="play-timer-control">
      <button
        type="button"
        className="play-timer-control__btn"
        onClick={togglePlay}
        aria-pressed={playing}
      >
        {playing ? '暂停' : '播放'}
      </button>
      <span className="play-timer-control__time" aria-live="polite">
        {formatTime(displaySeconds)}
      </span>
    </div>
  );
}

export default PlayTimerControl;
