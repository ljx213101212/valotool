/** 与时间轴标尺总长度一致；store clamp 与 TimelineRuler 共用 */
export const TIMELINE_TOTAL_SECONDS = 135;

/** 时间轴最小刻度（与剪映式键盘微调一致：一格 100ms） */
export const TIMELINE_STEP_MS = 100;
export const TIMELINE_STEP_SECONDS = TIMELINE_STEP_MS / 1000;

/**
 * 拖动指针量化后，与关键帧时间相差不超过该窗口则吸附到关键帧（默认等于一格 100ms）
 */
export const TIMELINE_KEYFRAME_SNAP_WINDOW_SECONDS = TIMELINE_STEP_SECONDS;
