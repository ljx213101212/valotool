import { readFile } from 'node:fs/promises';
import type { ExtractInput, ExtractResult, LlmExtractor } from './types';
import { parseVlmOutput } from './vlm-parse';
import { buildExtractPrompt } from '../prompts/extract-lineup';

/** 可退避重试的状态码：限流 / 服务暂不可用 */
const RETRYABLE = new Set([429, 503]);

export interface VlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  /** 注入点：测试用桩替换，不打真接口 */
  fetchImpl?: typeof fetch;
  /** 注入点：path → base64，测试可桩掉文件读取 */
  readImage?: (path: string) => Promise<string>;
  /** 429/503 最大重试次数（默认 3） */
  maxRetries?: number;
  /** 注入点：退避等待，测试可桩为 no-op */
  sleep?: (ms: number) => Promise<void>;
}

/** 从 env 取配置；无 key 返回 null（调用方回退 mock）。 */
export function vlmConfigFromEnv(): VlmConfig | null {
  const apiKey = process.env.VLM_API_KEY;
  if (!apiKey) return null;
  return {
    baseUrl: process.env.VLM_BASE_URL ?? 'https://api.deepseek.com',
    apiKey,
    model: process.env.VLM_MODEL ?? 'deepseek-v4-flash',
  };
}

/** 多模态 VLM extractor：把接触表 + 指令发给 OpenAI 兼容端点，抽软字段。 */
export class VlmExtractor implements LlmExtractor {
  constructor(private cfg: VlmConfig) {}

  async extract(input: ExtractInput): Promise<ExtractResult> {
    const doFetch = this.cfg.fetchImpl ?? fetch;
    const readImage = this.cfg.readImage ?? (async (p: string) => (await readFile(p)).toString('base64'));

    const content: unknown[] = [{ type: 'text', text: buildExtractPrompt(input) }];
    for (const path of input.images) {
      const b64 = await readImage(path);
      content.push({ type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } });
    }

    const sleep = this.cfg.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
    const maxRetries = this.cfg.maxRetries ?? 3;
    const reqInit = {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.cfg.apiKey}` },
      body: JSON.stringify({ model: this.cfg.model, messages: [{ role: 'user', content }], temperature: 0 }),
    };

    let res: Response;
    for (let attempt = 0; ; attempt++) {
      try {
        res = await doFetch(`${this.cfg.baseUrl}/chat/completions`, reqInit);
      } catch (e) {
        return { fields: {}, confidence: 0, warnings: [`VLM 请求失败：${(e as Error).message}`] };
      }
      if (RETRYABLE.has(res.status) && attempt < maxRetries) {
        await sleep(1000 * 2 ** attempt); // 1s, 2s, 4s
        continue;
      }
      break;
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { fields: {}, confidence: 0, warnings: [`VLM HTTP ${res.status}: ${body.slice(0, 400)}`] };
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content ?? '';
    const parsed = parseVlmOutput(raw);
    const got = Object.keys(parsed.fields).length;
    return {
      fields: parsed.fields,
      confidence: got ? 0.6 : 0.2,
      warnings: parsed.warnings,
    };
  }
}
