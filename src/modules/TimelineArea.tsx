import TimelineCursor from "./TimelineCursor";
import "./TimelineArea.less";
import { useCallback, useEffect, useRef, useState } from "react";
import TimelineRuler, { type TimelineConfig } from "../components/TimelineRuler";
import { convertPixelsToSeconds, convertSecondsToPixels } from "../utils/convert";


interface TimelineAreaProps {
    currentTime?: number;
    setCurrentTime?: (currentTime: number) => void;
}

const TimelineArea: React.FC<TimelineAreaProps> = ({ currentTime = 0, setCurrentTime }) => {

    /** 拖动中的像素位置；非拖动时为 null，光标由 currentTime 推导 */
    const [dragX, setDragX] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const areaRef = useRef<HTMLDivElement>(null);

    const [config] = useState<TimelineConfig>({
        totalDuration: 135,
        pixelsPerSecond: 25,
        height: 40,
        tickConfig: {
          majorTickInterval: 10,
          minorTickInterval: 1,
          majorTickHeight: 20,
          minorTickHeight: 10,
        },
      });

    const contentWidth = config.totalDuration * config.pixelsPerSecond;

    const applyPointerClientX = useCallback((clientX: number) => {
        const el = areaRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        let x = clientX - rect.left + el.scrollLeft;
        if (x < 0) x = 0;
        if (x > contentWidth) x = contentWidth;
        setDragX(x);
        const seconds = Math.max(
            0,
            Math.min(config.totalDuration, convertPixelsToSeconds(x, config.pixelsPerSecond)),
        );
        setCurrentTime?.(seconds);
    }, [contentWidth, config.totalDuration, config.pixelsPerSecond, setCurrentTime]);

    // 拖出区域时仍跟随鼠标；在 document 上结束拖动
    useEffect(() => {
        if (!isDragging) return;

        const handleMove = (e: MouseEvent) => {
            applyPointerClientX(e.clientX);
        };

        const handleUp = () => {
            setIsDragging(false);
            setDragX(null);
        };

        document.addEventListener("mousemove", handleMove);
        document.addEventListener("mouseup", handleUp);
        return () => {
            document.removeEventListener("mousemove", handleMove);
            document.removeEventListener("mouseup", handleUp);
        };
    }, [isDragging, applyPointerClientX]);


    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        applyPointerClientX(e.clientX);
    };

    const timePixels = convertSecondsToPixels(
        Math.max(0, Math.min(config.totalDuration, currentTime)),
        config.pixelsPerSecond,
    );
    const cursorX = isDragging && dragX !== null ? dragX : timePixels;

    return (<div className="timeline-area"
        ref={areaRef}
        onMouseDown={handleMouseDown}>


        <TimelineRuler config={config} />
        <TimelineCursor
            position={cursorX}
            height={Math.max(0, (areaRef.current?.clientHeight ?? 0) - 50)}
            isDragging={isDragging}
        />
    </div>)

}

export default TimelineArea;