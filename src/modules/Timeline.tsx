import { useHotkeys } from 'react-hotkeys-hook';
import { KeyframeDetailDrawer } from '../components/KeyframeDetailDrawer';
import { TIMELINE_STEP_SECONDS } from '../constants/timeline';
import { useTimelinePlaybackStore } from '../store/timelinePlaybackStore';
import { useTimelineInteractionBlocked } from '../store/uiOverlayStore';
import { PlayTimerControl } from '../components/PlayTimerControl';
import TimelineArea from './TimelineArea';

function targetIsEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
}

const Timeline = () => {
  const timelineBlocked = useTimelineInteractionBlocked();

  useHotkeys(
    'arrowleft',
    (e) => {
      if (timelineBlocked) return;
      if (targetIsEditable(e.target)) return;
      e.preventDefault();
      const { currentTime, seek } = useTimelinePlaybackStore.getState();
      seek(Math.max(0, currentTime - TIMELINE_STEP_SECONDS));
    },
    { enableOnFormTags: false },
    [timelineBlocked]
  );

  useHotkeys(
    'arrowright',
    (e) => {
      if (timelineBlocked) return;
      if (targetIsEditable(e.target)) return;
      e.preventDefault();
      const { currentTime, maxTime, seek } = useTimelinePlaybackStore.getState();
      seek(Math.min(maxTime, currentTime + TIMELINE_STEP_SECONDS));
    },
    { enableOnFormTags: false },
    [timelineBlocked]
  );

  return (
    <>
      <PlayTimerControl />
      <TimelineArea />
      <KeyframeDetailDrawer />
    </>
  );
};

export default Timeline;
