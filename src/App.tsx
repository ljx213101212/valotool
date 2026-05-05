import { useState } from 'react';
import './App.css';
import { PlayTimerControl } from './components/PlayTimerControl';
import { usePlaybackClock } from './hooks/usePlaybackClock';
import TimelineArea from './modules/TimelineArea';

/** 与时间轴 TimelineArea 内 config.totalDuration 保持一致 */
const TIMELINE_TOTAL_SECONDS = 135;

function App() {
  const [currentTime, setCurrentTime] = useState(0);
  const { playing, togglePlay } = usePlaybackClock({
    currentTime,
    setCurrentTime,
    maxTime: TIMELINE_TOTAL_SECONDS,
  });

  return (
    <>
      <h1>Timeline Editor</h1>
      <PlayTimerControl currentTime={currentTime} playing={playing} onTogglePlay={togglePlay} />
      <TimelineArea currentTime={currentTime} setCurrentTime={setCurrentTime} />

      {currentTime}
    </>
  );
}

export default App
