import './PlayTimerControl.less';

export type PlayTimerControlProps = {
  currentTime: number;
  playing: boolean;
  onTogglePlay: () => void;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00.000';
  const s = Math.floor(seconds % 60);
  const m = Math.floor(seconds / 60);
  const frac = seconds - Math.floor(seconds);
  const ms = Math.floor(frac * 1000);
  return `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

/** 仅负责展示与播放按钮；时钟逻辑由 usePlaybackClock 提供 */
export function PlayTimerControl({ currentTime, playing, onTogglePlay }: PlayTimerControlProps) {
  return (
    <div className="play-timer-control">
      <button
        type="button"
        className="play-timer-control__btn"
        onClick={onTogglePlay}
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
