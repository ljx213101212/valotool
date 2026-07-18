import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { ExtractInput, ExtractResult, LlmExtractor } from './types';
import { MockExtractor } from './mock';
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
  /** 设置后，按「模型+prompt+图像内容」哈希缓存成功结果，重跑命中不重复付费 */
  cacheDir?: string;
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

/** 按 env 选 extractor（INGEST_EXTRACTOR=vlm 且有 key 用 VLM，否则 mock）。cacheDir 透传。 */
export function extractorFromEnv(cacheDir?: string): { extractor: LlmExtractor; label: string } {
  if (process.env.INGEST_EXTRACTOR === 'vlm') {
    const cfg = vlmConfigFromEnv();
    if (cfg) return { extractor: new VlmExtractor({ ...cfg, cacheDir }), label: `vlm(${cfg.model})` };
    return { extractor: new MockExtractor(), label: 'mock（INGEST_EXTRACTOR=vlm 但缺 VLM_API_KEY）' };
  }
  return { extractor: new MockExtractor(), label: 'mock' };
}

function cacheKey(model: string, prompt: string, images: string[]): string {
  const h = createHash('sha256');
  h.update(model);
  h.update('\0');
  h.update(prompt);
  for (const img of images) {
    h.update('\0');
    h.update(img);
  }
  return h.digest('hex').slice(0, 32);
}

/** 多模态 VLM extractor：把接触表 + 指令发给 OpenAI 兼容端点，抽软字段。 */
export class VlmExtractor implements LlmExtractor {
  constructor(private cfg: VlmConfig) {}

  async extract(input: ExtractInput): Promise<ExtractResult> {
    const doFetch = this.cfg.fetchImpl ?? fetch;
    const readImage = this.cfg.readImage ?? (async (p: string) => (await readFile(p)).toString('base64'));

    const promptText = buildExtractPrompt(input);
    const content: unknown[] = [{ type: 'text', text: promptText }];
    const b64s: string[] = [];
    for (const path of input.images) {
      const b64 = await readImage(path);
      b64s.push(b64);
      content.push({ type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } });
    }

    // 缓存命中即返回（仅缓存成功结果）
    const cacheFile = this.cfg.cacheDir
      ? join(this.cfg.cacheDir, `${cacheKey(this.cfg.model, promptText, b64s)}.json`)
      : null;
    if (cacheFile) {
      const cached = await readFile(cacheFile, 'utf8')
        .then((s) => JSON.parse(s) as ExtractResult)
        .catch(() => null);
      if (cached) return cached;
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
    const result: ExtractResult = { fields: parsed.fields, confidence: got ? 0.6 : 0.2, warnings: parsed.warnings };

    if (cacheFile) {
      await mkdir(dirname(cacheFile), { recursive: true });
      await writeFile(cacheFile, JSON.stringify(result));
    }
    return result;
  }
}
