import TimelineCursor from "./TimelineCursor";
import "./TimelineArea.less";
import { useState } from "react";

const TimelineArea = () => {

    const [isDragging, setIsDragging] = useState<boolean>(false);
    return (<div className="timeline-area" 
        
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}>
        <TimelineCursor position={100} height={100} isDragging={isDragging} />
    </div>)

}

export default TimelineArea;