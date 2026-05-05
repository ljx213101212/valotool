import TimelineCursor from "./TimelineCursor";
import "./TimelineArea.less";
import { useEffect, useRef, useState } from "react";

const TimelineArea = () => {

    // 光标位置
    const [cursorX, setCursorX] = useState(100);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const areaRef = useRef<HTMLDivElement>(null);


    // 鼠标按下：开始拖动
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        // 点击时立即定位
        if (areaRef.current) {
            const rect = areaRef.current.getBoundingClientRect();
            setCursorX(e.clientX - rect.left);
        }
    };

    // 鼠标移动：仅拖动时更新位置
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        if (!areaRef.current) return;

        const rect = areaRef.current.getBoundingClientRect();
        let x = e.clientX - rect.left;

        // 限制在容器内
        if (x < 0) x = 0;
        if (x > rect.width) x = rect.width;


        setCursorX(x);
    };

    // 鼠标松开/离开：结束拖动
    const handleDragEnd = () => setIsDragging(false);

    console.log("cursorX", cursorX);

    return (<div className="timeline-area"
        ref={areaRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove} // 🔥 只监听容器自身 mousemove
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}>
        <TimelineCursor position={cursorX} height={areaRef.current?.clientHeight - 50} isDragging={isDragging} />
    </div>)

}

export default TimelineArea;