import { Timeline, type TimelineState, type EditData  } from '@xzdarcy/react-timeline-editor';
import React, { useEffect, useState, type FC } from 'react';
import { scale, scaleWidth, startLeft } from './mocks';
import type { TimelineRow } from '@xzdarcy/timeline-engine';
import { mockData } from './mocks';
import './TimelineEditor.less';

const TimelineEditor: FC<{
  timelineState: React.MutableRefObject<TimelineState>;
  currentTime: number;
  setCurrentTime: (time: number) => void;
}> = ({ timelineState, currentTime, setCurrentTime }) => {

  const [data, setData] = useState(mockData);
   // 监听时间轴实例加载完成
   useEffect(() => {
    if (timelineState.current) {
      console.log('时间轴实例已加载：', timelineState.current);
      // 调用实例API：自动定位到时间 0
      timelineState.current.setTime(0);
      timelineState.current.setScrollLeft(0);
    }
  }, []);



  return (
    <div className="timeline-editor-example0">
     <Timeline
        scale={scale}
        scaleWidth={scaleWidth}
        startLeft={startLeft}
        autoScroll={true}
        ref={timelineState}
        editorData={data}
        effects={{}}
        onChange={(data) => {
          console.log(data);
          setData(data as TimelineRow[]);
        }}
      />
    </div>
  );
};

export default TimelineEditor;