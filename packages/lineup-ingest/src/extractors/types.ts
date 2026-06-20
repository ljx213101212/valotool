import type { Lineup } from '@valotool/lineup-content';

/** 喂给 LLM 的输入：硬字段（side/site）不在此，已由 extract 阶段用 parseQuery 确定 */
export interface ExtractInput {
  subtitleText: string;
  ocrText: string[];
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

/**
 * 把具体模型隔离在接口后面：换 DeepSeek/通义/Claude 不动主流程，
 * 测试与 eval 用 MockExtractor 注入。
 */
export interface LlmExtractor {
  extract(input: ExtractInput): Promise<ExtractResult>;
}
