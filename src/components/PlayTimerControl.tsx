import { useTimelinePlaybackStore } from '../store/timelinePlaybackStore';
import './PlayTimerControl.less';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00.000';
  const s = Math.floor(seconds % 60);
  const m = Math.floor(seconds / 60);
  const frac = seconds - Math.floor(seconds);
  const ms = Math.floor(frac * 1000);
  return `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

export function PlayTimerControl() {
  const currentTime = useTimelinePlaybackStore((s) => s.currentTime);
  const playing = useTimelinePlaybackStore((s) => s.playing);
  const togglePlay = useTimelinePlaybackStore((s) => s.togglePlay);

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
        {formatTime(currentTime)}
      </span>
    </div>
  );
}

export default PlayTimerControl;
