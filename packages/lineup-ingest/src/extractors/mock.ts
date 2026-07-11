import type { ExtractInput, ExtractResult, LlmExtractor } from './types';

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
}
