import type { ExtractInput, ExtractResult, LlmExtractor } from './types';

/**
 * 确定性桩：不调任何外部服务，给低置信草稿。
 * 用于打通管线、跑 eval、本地无网开发。
 */
export class MockExtractor implements LlmExtractor {
  async extract(input: ExtractInput): Promise<ExtractResult> {
    const purpose = input.subtitleText.trim().slice(0, 40) || 'TODO 用途（mock）';
    return {
      fields: { purpose },
      confidence: 0.1,
      warnings: ['MockExtractor：未接真实 LLM，软字段为占位'],
    };
  }
}
