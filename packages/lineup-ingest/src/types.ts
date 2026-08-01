import { z } from 'zod';
import type { Lineup } from '@valotool/lineup-content';
import type { LlmExtractor } from './extractors/types';

// ───────────────────────── sources/*.json 契约 ─────────────────────────

/** 手抄自视频简介的时间轴一行：起点 + 小标题（结束点由下一段推） */
export const manualSegmentSchema = z.object({
  startSec: z.number().nonnegative(),
  title: z.string().min(1),
});
export type ManualSegment = z.infer<typeof manualSegmentSchema>;

/** 一个采集源（一条 B 站视频） */
export const sourceVideoSchema = z.object({
  id: z.string().regex(/^BV[0-9A-Za-z]{10}$/, 'id 须为 B 站 bvid'),
  platform: z.literal('bilibili'),
  url: z.string().url(),
  title: z.string().min(1),
  creator: z.string().min(1),
  creatorUid: z.string().optional(),
  recordedPatch: z.string().regex(/^\d+\.\d+$/).optional(),
  hints: z.object({ map: z.string().optional(), agent: z.string().optional() }).optional(),
  credit: z.string().min(1),
  segments: z.array(manualSegmentSchema).optional(),
  note: z.string().optional(),
});
export type SourceVideo = z.infer<typeof sourceVideoSchema>;

export const sourceFileSchema = z.array(sourceVideoSchema);

// ───────────────────────── pipeline 中间表示（IR） ─────────────────────────

export type FrameRole = string;

export interface Chapter {
  index: number;
  startSec: number;
  endSec: number;
  title: string;
}

/** fetch 阶段产物：下载好的视频 + 字幕 + 章节 */
export interface RawCapture {
  source: SourceVideo;
  videoPath: string;
  subtitlePath?: string;
  chapters: Chapter[];
  durationSec: number;
}

/** segment 阶段产物：一条候选点位的时间切片 */
export interface Segment {
  videoId: string;
  segmentId: string;
  startSec: number;
  endSec: number;
  title?: string;
  subtitleText: string;
}

/** 一张候选帧及其在视频中的绝对秒 */
export interface FrameCandidate {
  path: string;
  atSec: number;
}

/** capture 阶段产物：切片 + 候选帧（镜头切变取）+ 接触表 + 视频片段 */
export type CapturedSegment = Segment & {
  candidates: FrameCandidate[];
  contactSheet?: string;
  clipPath?: string;
};

/** 溯源信息，贯穿到 DraftLineup（版权/致谢/回查用） */
export interface Provenance {
  videoId: string;
  url: string;
  creator: string;
  startSec: number;
  endSec: number;
}

/**
 * IR：Lineup 的超集。审核前一切可选，带溯源/置信度/审核态。
 * 人审通过后由 promote 塌缩成合法 Lineup。
 */
export interface DraftLineup {
  draftId: string;
  fields: Partial<Lineup>;
  /** 人审从 candidates 指派的最终三帧（初始为空） */
  frames: Partial<Record<FrameRole, string>>;
  /** capture 在镜头切变处取的候选帧 */
  candidates: FrameCandidate[];
  /** 该段 1fps 接触表拼图，供人审快速扫看 */
  contactSheet?: string;
  provenance: Provenance;
  confidence: number;
  warnings: string[];
  reviewStatus: 'pending' | 'approved' | 'rejected';
}

// ───────────────────────── 运行时上下文 ─────────────────────────

export interface PipelineCtx {
  /** 每个视频独立工作目录，如 .work/<bvid> */
  workDir: string;
  extractor: LlmExtractor;
  /** 可选的视频分析 extractor，如可用则优先于 extractor 用于帧预选 */
  videoExtractor?: LlmExtractor;
  log: (msg: string) => void;
}
