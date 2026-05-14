import { useHotkeys } from 'react-hotkeys-hook';
import { KeyframeDetailDrawer } from '@/features/keyframes/components/KeyframeDetailDrawer';
import { TIMELINE_STEP_SECONDS } from '@/shared/constants/timeline';
import { useTimelinePlaybackStore } from '@/shared/store/timelinePlaybackStore';
import { useTimelineInteractionBlocked } from '@/shared/store/uiOverlayStore';
import { PlayTimerControl } from './PlayTimerControl';
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
