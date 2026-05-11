import { useHotkeys } from 'react-hotkeys-hook';
import { TIMELINE_STEP_SECONDS } from '../constants/timeline';
import { useTimelinePlaybackStore } from '../store/timelinePlaybackStore';
import { PlayTimerControl } from '../components/PlayTimerControl';
import TimelineArea from './TimelineArea';

function targetIsEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
}

const Timeline = () => {
  useHotkeys(
    'arrowleft',
    (e) => {
      if (targetIsEditable(e.target)) return;
      e.preventDefault();
      const { currentTime, seek } = useTimelinePlaybackStore.getState();
      seek(Math.max(0, currentTime - TIMELINE_STEP_SECONDS));
    },
    { enableOnFormTags: false }
  );

  useHotkeys(
    'arrowright',
    (e) => {
      if (targetIsEditable(e.target)) return;
      e.preventDefault();
      const { currentTime, maxTime, seek } = useTimelinePlaybackStore.getState();
      seek(Math.min(maxTime, currentTime + TIMELINE_STEP_SECONDS));
    },
    { enableOnFormTags: false }
  );

  return (
    <>
      <PlayTimerControl />
      <TimelineArea />
    </>
  );
};

export default Timeline;
