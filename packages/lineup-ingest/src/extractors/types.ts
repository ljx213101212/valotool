import type { Lineup } from '@valotool/lineup-content';
import type { Chapter, FrameCandidate, FrameRole } from '../types';

/** 喂给 LLM 的输入：硬字段（side/site）不在此，已由 extract 阶段用 parseQuery 确定 */
export interface ExtractInput {
  /** 段标题（up 主时间轴叫法），强上下文信号 */
  title?: string;
  subtitleText: string;
  ocrText: string[];
  /** 给多模态 VLM 看的图像（文件路径），默认该段接触表 */
  images: string[];
  hints?: { map?: string; agent?: string };
  /** 闭词表，用来约束模型输出、压幻觉 */
  vocab: { maps: string[]; agents: string[] };
}

export interface ExtractResult {
  /** 只负责软字段：purpose / technique / origin / target / timing */
  fields: Partial<Lineup>;
  confidence: number;
  warnings: string[];
}

/** VLM 帧选择的输入 */
export interface FrameSelectionInput {
  /** 该段候选帧列表 */
  candidates: FrameCandidate[];
  /** 接触表路径（可选，供概览上下文） */
  contactSheet?: string;
  /** 段标题（上下文信号） */
  title?: string;
  /** agent slug，决定需要识别哪些帧角色 */
  agentSlug: string;
  /** 视频片段路径（可选，供视频分析 extractor 使用） */
  videoPath?: string;
}

export interface FrameSelection {
  /** 指派后的候选帧路径 */
  framePath: string;
  /** 角色名 */
  role: FrameRole;
  /** 该帧对这一角色的置信度 0-1 */
  confidence: number;
}

export interface FrameSelectionResult {
  selections: FrameSelection[];
  confidence: number;
  warnings: string[];
}

/** VLM 字幕语义分段结果 */
export interface SubtitleSegmentsResult {
  segments: Chapter[];
  warnings: string[];
}

/**
 * 把具体模型隔离在接口后面：换 DeepSeek/通义/Claude 不动主流程，
 * 测试与 eval 用 MockExtractor 注入。
 */
export interface LlmExtractor {
  extract(input: ExtractInput): Promise<ExtractResult>;
  /** 从候选帧中自动选择 stand/aim/effect 等角色帧 */
  selectFrames(input: FrameSelectionInput): Promise<FrameSelectionResult>;
  /** 从字幕全文语义识别点位边界（纯文本，无图） */
  segmentSubtitles(subtitleText: string, durationSec: number): Promise<SubtitleSegmentsResult>;
}
