import { useRef, useState } from "react";
import { mockData } from "../components/mocks";
import type { TimelineState } from "@xzdarcy/react-timeline-editor";

const useTimelineData = () => {
    const timelineState = useRef<TimelineState>(null); 
    const [timelineData, setTimelineData] = useState(mockData);
    const [currentTime, setCurrentTime] = useState(0);

    return { timelineState, timelineData, setTimelineData, currentTime, setCurrentTime };
};

export default useTimelineData;