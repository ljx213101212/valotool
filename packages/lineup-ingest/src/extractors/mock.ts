import type { ExtractInput, ExtractResult, FrameSelectionInput, FrameSelectionResult, LlmExtractor, SubtitleSegmentsResult } from './types';

/**
 * 确定性桩：不调任何外部服务，给低置信草稿。
 * 用于打通管线、跑 eval、本地无网开发。
 */
export class MockExtractor implements LlmExtractor {
  async extract(_input: ExtractInput): Promise<ExtractResult> {
    return {
      fields: {},
      confidence: 0.1,
      warnings: ['MockExtractor：未接真实 LLM，软字段待人审填写'],
    };
  }

  async selectFrames(_input: FrameSelectionInput): Promise<FrameSelectionResult> {
    return { selections: [], confidence: 0, warnings: ['MockExtractor：未接真实 LLM，帧待人审指派'] };
  }

  async segmentSubtitles(_subtitleText: string, _durationSec: number): Promise<SubtitleSegmentsResult> {
    return { segments: [], warnings: ['MockExtractor：未接真实 LLM，无法语义分段'] };
  }
}
