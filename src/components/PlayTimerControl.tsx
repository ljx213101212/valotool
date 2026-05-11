import {
  CaretRightOutlined,
  DeleteOutlined,
  PauseOutlined,
  PlusOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
} from '@ant-design/icons';
import { useTimelinePlaybackStore } from '../store/timelinePlaybackStore';
import {
  useKeyframeSkipAvailability,
  usePlayheadAtKeyframe,
  useTimelineKeyframeStore,
} from '../store/timelineKeyframeStore';
import { formatTimelineQuantized } from '../utils/timelineQuantize';
import './PlayTimerControl.less';

export function PlayTimerControl() {
  const currentTime = useTimelinePlaybackStore((s) => s.currentTime);
  const maxTime = useTimelinePlaybackStore((s) => s.maxTime);
  const playing = useTimelinePlaybackStore((s) => s.playing);
  const togglePlay = useTimelinePlaybackStore((s) => s.togglePlay);
  const seekToPrevKeyframe = useTimelineKeyframeStore((s) => s.seekToPrevKeyframe);
  const seekToNextKeyframe = useTimelineKeyframeStore((s) => s.seekToNextKeyframe);
  const addKeyframeAtCurrentTime = useTimelineKeyframeStore((s) => s.addKeyframeAtCurrentTime);
  const removeKeyframeAtCurrentTime = useTimelineKeyframeStore((s) => s.removeKeyframeAtCurrentTime);
  const atKeyframe = usePlayheadAtKeyframe(currentTime, maxTime);
  const { canPrev, canNext } = useKeyframeSkipAvailability(currentTime, maxTime);

  return (
    <div className="play-timer-control">
      <button
        type="button"
        className="play-timer-control__icon-btn"
        onClick={seekToPrevKeyframe}
        disabled={!canPrev}
        aria-label="快退到上一关键帧"
        title="快退到上一关键帧"
      >
        <StepBackwardOutlined />
      </button>
      <button
        type="button"
        className="play-timer-control__icon-btn play-timer-control__icon-btn--primary"
        onClick={togglePlay}
        aria-pressed={playing}
        aria-label={playing ? '暂停' : '播放'}
        title={playing ? '暂停' : '播放'}
      >
        {playing ? <PauseOutlined /> : <CaretRightOutlined />}
      </button>
      <button
        type="button"
        className="play-timer-control__icon-btn"
        onClick={seekToNextKeyframe}
        disabled={!canNext}
        aria-label="快进到下一关键帧"
        title="快进到下一关键帧"
      >
        <StepForwardOutlined />
      </button>
      {atKeyframe ? (
        <button
          type="button"
          className="play-timer-control__icon-btn play-timer-control__icon-btn--delete-keyframe"
          onClick={removeKeyframeAtCurrentTime}
          aria-label="删除当前时间的关键帧"
          title="删除当前时间的关键帧"
        >
          <DeleteOutlined />
        </button>
      ) : (
        <button
          type="button"
          className="play-timer-control__icon-btn play-timer-control__icon-btn--add-keyframe"
          onClick={addKeyframeAtCurrentTime}
          aria-label="在当前时间添加关键帧"
          title="添加关键帧（记录当前地图与阵容状态）"
        >
          <PlusOutlined />
        </button>
      )}
      <span className="play-timer-control__time" aria-live="polite">
        {formatTimelineQuantized(currentTime, maxTime)}
      </span>
    </div>
  );
}

export default PlayTimerControl;
