import './App.css'
import { PlayTimerControl } from './components/PlayTimerControl';
import TimelineArea from './modules/TimelineArea';


function App() {

  // const { timelineState, timelineData, setTimelineData, currentTime, setCurrentTime } = useTimelineData();

  return (
    <>
    <h1>Timeline Editor</h1>
    {/* <TimelinePlayer timelineState={timelineState}  />
    <TimelineEditor timelineState={timelineState} currentTime={currentTime} setCurrentTime={setCurrentTime}/> */}
      <PlayTimerControl onTick={(elapsedSeconds) => {
        console.log("elapsedSeconds", elapsedSeconds);
      }} />
     <TimelineArea/>
    </>
  )
}

export default App
