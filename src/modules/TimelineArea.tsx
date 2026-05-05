import TimelineCursor from "./TimelineCursor";
import "./TimelineArea.less";
import { useCallback, useEffect, useRef, useState } from "react";
import TimelineRuler, { type TimelineConfig } from "../components/TimelineRuler";
import { TIMELINE_TOTAL_SECONDS } from "../constants/timeline";
import { useTimelinePlaybackStore } from "../store/timelinePlaybackStore";
import { convertPixelsToSeconds, convertSecondsToPixels } from "../utils/convert";

const TimelineArea: React.FC = () => {
    const currentTime = useTimelinePlaybackStore((s) => s.currentTime);
    const seek = useTimelinePlaybackStore((s) => s.seek);

    /** 拖动中的像素位置；非拖动时为 null，光标由 currentTime 推导 */
    const [dragX, setDragX] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const areaRef = useRef<HTMLDivElement>(null);

    const [config] = useState<TimelineConfig>({
        totalDuration: TIMELINE_TOTAL_SECONDS,
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
        seek(seconds);
    }, [contentWidth, config.totalDuration, config.pixelsPerSecond, seek]);

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