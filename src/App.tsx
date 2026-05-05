import './App.css';
import { PlayTimerControl } from './components/PlayTimerControl';
import TimelineArea from './modules/TimelineArea';
import { useTimelinePlaybackStore } from './store/timelinePlaybackStore';

function App() {
  const currentTime = useTimelinePlaybackStore((s) => s.currentTime);

  return (
    <>
      <h1>Timeline Editor</h1>
      <PlayTimerControl />
      <TimelineArea />

    </>
  );
}

export default App;
