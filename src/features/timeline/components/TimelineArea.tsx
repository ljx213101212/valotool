import TimelineCursor from "./TimelineCursor";
import "./TimelineArea.less";
import { useCallback, useEffect, useRef, useState } from "react";
import TimelineRuler, { type TimelineConfig } from './TimelineRuler';
import { TIMELINE_TOTAL_SECONDS } from '@/shared/constants/timeline';
import { useTimelinePlaybackStore } from '@/shared/store/timelinePlaybackStore';
import { useTimelineKeyframeStore } from '@/shared/store/timelineKeyframeStore';
import { useTimelineInteractionBlocked } from '@/shared/store/uiOverlayStore';
import { convertPixelsToSeconds, convertSecondsToPixels } from '@/shared/utils/convert';
import { snapPointerToNearestKeyframe } from '@/shared/utils/timelineKeyframeSnap';

const KEYFRAME_DRAG_THRESHOLD_PX = 4;

const TimelineArea: React.FC = () => {
    const currentTime = useTimelinePlaybackStore((s) => s.currentTime);
    const seek = useTimelinePlaybackStore((s) => s.seek);
    const keyframes = useTimelineKeyframeStore((s) => s.keyframes);
    const moveKeyframeTime = useTimelineKeyframeStore((s) => s.moveKeyframeTime);
    const timelineBlocked = useTimelineInteractionBlocked();

    /** 拖动中的像素位置；非拖动时为 null，光标由 currentTime 推导 */
    const [dragX, setDragX] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [keyframeDragId, setKeyframeDragId] = useState<string | null>(null);
    const areaRef = useRef<HTMLDivElement>(null);
    const keyframeDragMovedRef = useRef(false);
    const keyframeDragStartClientXRef = useRef(0);

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
        const xRaw = clientX - rect.left + el.scrollLeft;
        const { xPx, seconds } = snapPointerToNearestKeyframe(xRaw, keyframes, {
            totalDuration: config.totalDuration,
            pixelsPerSecond: config.pixelsPerSecond,
            contentWidth,
        });
        setDragX(xPx);
        seek(seconds);
    }, [contentWidth, config.totalDuration, config.pixelsPerSecond, keyframes, seek]);

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

    useEffect(() => {
        if (!keyframeDragId) return;

        const handleMove = (e: MouseEvent) => {
            if (Math.abs(e.clientX - keyframeDragStartClientXRef.current) > KEYFRAME_DRAG_THRESHOLD_PX) {
                keyframeDragMovedRef.current = true;
            }
            const el = areaRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            let x = e.clientX - rect.left + el.scrollLeft;
            if (x < 0) x = 0;
            if (x > contentWidth) x = contentWidth;
            const seconds = Math.max(
                0,
                Math.min(config.totalDuration, convertPixelsToSeconds(x, config.pixelsPerSecond)),
            );
            moveKeyframeTime(keyframeDragId, seconds);
        };

        const handleUp = () => {
            setKeyframeDragId(null);
        };

        document.addEventListener("mousemove", handleMove);
        document.addEventListener("mouseup", handleUp);
        return () => {
            document.removeEventListener("mousemove", handleMove);
            document.removeEventListener("mouseup", handleUp);
        };
    }, [keyframeDragId, contentWidth, config.totalDuration, config.pixelsPerSecond, moveKeyframeTime]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (timelineBlocked) return;
        e.preventDefault();
        setIsDragging(true);
        applyPointerClientX(e.clientX);
    };

    const timePixels = convertSecondsToPixels(
        Math.max(0, Math.min(config.totalDuration, currentTime)),
        config.pixelsPerSecond,
    );
    const cursorX = isDragging && dragX !== null ? dragX : timePixels;
    const rulerMidY = config.height / 2;

    return (<div
        className={`timeline-area${timelineBlocked ? " timeline-area--blocked" : ""}`}
        ref={areaRef}
        onMouseDown={handleMouseDown}
        aria-disabled={timelineBlocked}
        >


        <div className="timeline-area__rulerTrack" style={{ width: contentWidth }}>
          <TimelineRuler config={config} />
          {keyframes.map((kf) => (
            <button
              key={kf.id}
              type="button"
              className={`timeline-keyframe-marker${keyframeDragId === kf.id ? " timeline-keyframe-marker--dragging" : ""}`}
              style={{
                left: `${kf.time * config.pixelsPerSecond}px`,
                top: `${rulerMidY}px`,
              }}
              aria-label={`关键帧 ${kf.time.toFixed(1)} 秒，可拖动`}
              title="拖动调整时间，点击跳转并恢复快照"
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                keyframeDragMovedRef.current = false;
                keyframeDragStartClientXRef.current = e.clientX;
                setKeyframeDragId(kf.id);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (keyframeDragMovedRef.current) return;
                seek(kf.time);
              }}
            />
          ))}
        </div>
        <TimelineCursor
            position={cursorX}
            height={Math.max(0, (areaRef.current?.clientHeight ?? 0) - 50)}
            isDragging={isDragging}
        />
    </div>)

}

export default TimelineArea;
