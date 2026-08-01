import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { getAgentFrameRoles } from '@valotool/lineup-content';
import type { ExtractInput, ExtractResult, FrameSelectionInput, FrameSelectionResult, LlmExtractor, SubtitleSegmentsResult } from './types';
import { MockExtractor } from './mock';
import { parseVlmOutput } from './vlm-parse';
import { buildExtractPrompt } from '../prompts/extract-lineup';
import { buildFrameSelectionPrompt } from '../prompts/video-frame';
import { buildJettFramePrompt } from '../prompts/video-frame/jett';
import { buildDefaultFramePrompt } from '../prompts/video-frame/default';

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

  /** 发起 VLM 调用，含退避重试和缓存 */
  private async call(promptText: string, b64s: string[]): Promise<string> {
    const doFetch = this.cfg.fetchImpl ?? fetch;

    const cacheFile = this.cfg.cacheDir
      ? join(this.cfg.cacheDir, `${cacheKey(this.cfg.model, promptText, b64s)}.json`)
      : null;
    if (cacheFile) {
      const cached = await readFile(cacheFile, 'utf8')
        .then((s) => JSON.parse(s) as { raw: string })
        .catch(() => null);
      if (cached) return cached.raw;
    }

    const content: unknown[] = [{ type: 'text', text: promptText }];
    for (const b64 of b64s) {
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
        throw new Error(`VLM 请求失败：${(e as Error).message}`);
      }
      if (RETRYABLE.has(res.status) && attempt < maxRetries) {
        await sleep(1000 * 2 ** attempt);
        continue;
      }
      break;
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`VLM HTTP ${res.status}: ${body.slice(0, 400)}`);
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content ?? '';

    if (cacheFile) {
      await mkdir(dirname(cacheFile), { recursive: true });
      await writeFile(cacheFile, JSON.stringify({ raw }));
    }
    return raw;
  }

  async extract(input: ExtractInput): Promise<ExtractResult> {
    const readImage = this.cfg.readImage ?? (async (p: string) => (await readFile(p)).toString('base64'));
    const promptText = buildExtractPrompt(input);
    const b64s: string[] = [];
    for (const path of input.images) {
      b64s.push(await readImage(path));
    }

    try {
      const raw = await this.call(promptText, b64s);
      const parsed = parseVlmOutput(raw);
      const got = Object.keys(parsed.fields).length;
      return { fields: parsed.fields, confidence: got ? 0.6 : 0.2, warnings: parsed.warnings };
    } catch (e) {
      return { fields: {}, confidence: 0, warnings: [String(e)] };
    }
  }

  async selectFrames(input: FrameSelectionInput): Promise<FrameSelectionResult> {
    const readImage = this.cfg.readImage ?? (async (p: string) => (await readFile(p)).toString('base64'));

    const MAX_IMAGES = 5;
    const cands = input.candidates;
    if (cands.length === 0) return { selections: [], confidence: 0, warnings: ['无候选帧'] };

    const step = Math.max(1, Math.floor(cands.length / MAX_IMAGES));
    const sampled: { idx: number; cand: typeof cands[number] }[] = [];
    for (let i = 0; i < cands.length && sampled.length < MAX_IMAGES; i += step) {
      sampled.push({ idx: i, cand: cands[i] });
    }
    // 确保包含最后一帧
    if (sampled.length > 0 && sampled[sampled.length - 1].idx < cands.length - 1) {
      sampled[sampled.length - 1] = { idx: cands.length - 1, cand: cands[cands.length - 1] };
    }

    const promptText = [
      '以下是按时间顺序排列的 ' + sampled.length + ' 张无畏契约(Valorant)游戏截图（第 1 张最早，最后一张最晚）。',
      `这个点位叫「${input.title ?? '(未知)'}」。`,
      '',
      '请找出以下三张关键帧的编号（1=' + sampled.length + ' 张中的第几张）：',
      '- stand（站位帧）：玩家已经站定、准备释放技能的画面。特征是准星对准某个参考物（墙角/云/建筑边缘），HUD 上技能图标亮着。',
      '- aim（瞄准帧）：准星精确对准参考点的画面。特征是画面中央有十字准星，可能对准天空、墙壁特定位置。',
      '- effect（落点帧）：技能已经释放、烟雾/箭矢等效果出现在画面中的画面。',
      '',
      '只输出 JSON（不要其他文字）：',
      '{"stand":<第几张>,"aim":<第几张>,"effect":<第几张>}',
      '找不到某张就填 0，不要填 null 或省略。',
    ].join('\n');

    try {
      const b64s: string[] = [];
      for (const s of sampled) {
        b64s.push(await readImage(s.cand.path));
      }

      const raw = await this.call(promptText, b64s);
      let obj: Record<string, unknown>;
      try {
        const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
        obj = JSON.parse((fenced ? fenced[1] : raw).trim());
        if (!obj || typeof obj !== 'object') throw new Error('not object');
      } catch {
        return { selections: [], confidence: 0, warnings: ['VLM 帧选择输出非合法 JSON'] };
      }

      const idxMap = new Map(sampled.map((s, seqIdx) => [seqIdx + 1, s.cand]));

      const warnings: string[] = [];
      const selections = [];
      for (const role of ['stand', 'aim', 'effect'] as const) {
        let seq = obj[role];
        if (typeof seq === 'string') seq = Number(seq);
        if (typeof seq !== 'number' || !Number.isFinite(seq) || seq <= 0 || seq > sampled.length) continue;
        const cand = idxMap.get(seq);
        if (!cand) continue;
        selections.push({ framePath: cand.path, role, confidence: 0.5 });
      }

      return {
        selections,
        confidence: selections.length >= 2 ? 0.5 : selections.length > 0 ? 0.3 : 0,
        warnings,
      };
    } catch (e) {
      return { selections: [], confidence: 0, warnings: [String(e)] };
    }
  }

  async segmentSubtitles(subtitleText: string, durationSec: number): Promise<SubtitleSegmentsResult> {
    const promptText = [
      '你在看一段 Valorant《无畏契约》点位教学视频的字幕文本。',
      '每条字幕带有时间戳（秒），按时间顺序排列。',
      '视频时长约 ' + durationSec + ' 秒。',
      '',
      '你的任务：识别这个视频中每一个「点位教学段」的开始时间。',
      '',
      '点位教学的典型特征是：主播正在讲解或演示一个具体的技能使用方法。',
      '不同主播用语不同，你需要灵活理解：',
      '- 有些说「第一种」「第二种」「第一个点位」',
      '- 有些说「A大进攻箭」「B点防守箭」',
      '- 有些说「接下来是」「然后是」「下面教大家」',
      '- 有些字幕直接描述位置和动作',
      '',
      '每个段落的开始秒数以字幕时间戳为准。',
      '段落之间通常有明确的话题转换（切换地图位置、切换攻防方向、使用序数词等）。',
      '只输出 JSON 数组，不要有其他文字：',
      '[',
      '  {"startSec": <秒数>, "title": "<简短描述>"},',
      '  ...',
      ']',
      '',
      '如果整个视频只有一个点位，那就只输出一条。',
      '标题用 10 个字以内的简短中文，概括这段在教什么。',
      '',
      '=== 字幕开始 ===',
      subtitleText,
      '=== 字幕结束 ===',
    ].join('\n');

    try {
      const raw = await this.call(promptText, []);
      let arr: unknown[];
      try {
        const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
        arr = JSON.parse((fenced ? fenced[1] : raw).trim());
        if (!Array.isArray(arr)) throw new Error('not array');
      } catch {
        return { segments: [], warnings: ['VLM 字幕分段输出非合法 JSON 数组'] };
      }

      const warnings: string[] = [];
      const segments = [];
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i] as Record<string, unknown>;
        const startSec = Number(item.startSec);
        const title = String(item.title ?? '').trim();
        if (!Number.isFinite(startSec) || startSec < 0 || startSec > durationSec) {
          warnings.push(`VLM 字幕分段第 ${i} 条 startSec 非法（${item.startSec}），已丢弃`);
          continue;
        }
        if (!title) {
          warnings.push(`VLM 字幕分段第 ${i} 条缺 title，已丢弃`);
          continue;
        }
        segments.push({ index: segments.length, startSec, endSec: 0, title });
      }

      // 填充 endSec：每段 endSec = 下一段 startSec，末段 = 视频结束
      for (let i = 0; i < segments.length; i++) {
        segments[i].endSec = segments[i + 1]?.startSec ?? durationSec;
      }

      return { segments, warnings };
    } catch (e) {
      return { segments: [], warnings: [String(e)] };
    }
  }
}
