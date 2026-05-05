import './App.css'
import TimelineArea from './modules/TimelineArea';


function App() {

  // const { timelineState, timelineData, setTimelineData, currentTime, setCurrentTime } = useTimelineData();

  return (
    <>
    <h1>Timeline Editor</h1>
    {/* <TimelinePlayer timelineState={timelineState}  />
    <TimelineEditor timelineState={timelineState} currentTime={currentTime} setCurrentTime={setCurrentTime}/> */}

     <TimelineArea/>
    </>
  )
}

export default App
