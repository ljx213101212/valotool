// TimelineCursor.tsx
import React from 'react';
import './TimelineCursor.less';

interface TimelineCursorProps {
  /** 光标水平位置 (px) */
  position: number;
  /** 光标竖线高度 (px) */
  height: number;
  /** 是否正在被dragging */
  isDragging: boolean;
}

const TimelineCursor: React.FC<TimelineCursorProps> = ({ position, height, isDragging = false }) => {

  return (
    <div
      className="timeline-cursor"
      style={{
        left: `${position}px`, // 核心：靠 left 控制位置
        height: `${height}px`,
      }}
    >
      {/* 顶部三角箭头 */}
      <div className="timeline-cursor-arrow" style={{
        backgroundColor:  `${isDragging ? "#fff" : "transparent"}`
      }}/>
      {/* 垂直竖线 */}
      <div className="timeline-cursor-line" />
    </div>
  );
};

export default TimelineCursor;