import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';
import type { ExtractInput, ExtractResult, FrameSelectionInput, FrameSelectionResult, LlmExtractor, SubtitleSegmentsResult } from './types';
import { MockExtractor } from './mock';
import { buildVideoFramePrompt } from '../prompts/video-frame/index';

const RETRYABLE = new Set([429, 503]);

export interface VideoLlmConfig {
  baseUrl?: string;
  apiKey: string;
  model: string;
  cacheDir?: string;
}

/** 从 env 取 Gemini 视频分析配置 */
export function videoLlmConfigFromEnv(): VideoLlmConfig | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash',
    baseUrl: process.env.GEMINI_BASE_URL,
  };
}

function cacheKey(model: string, prompt: string, videoBase64: string): string {
  const h = createHash('sha256');
  h.update(model);
  h.update('\0');
  h.update(prompt);
  h.update('\0');
  h.update(videoBase64);
  return h.digest('hex').slice(0, 32);
}

function buildCurlProxyArg(): string {
  const proxy = process.env.https_proxy ?? process.env.HTTPS_PROXY ?? '';
  return proxy ? `--proxy ${proxy}` : '';
}

/** 视频分析 VLM extractor：把视频片段发给 Gemini 识别各阶段帧 */
export class VideoLlmExtractor implements LlmExtractor {
  private mock = new MockExtractor();

  constructor(private cfg: VideoLlmConfig) {}

  async extract(_input: ExtractInput): Promise<ExtractResult> {
    return this.mock.extract(_input);
  }

  async selectFrames(input: FrameSelectionInput): Promise<FrameSelectionResult> {
    const cands = input.candidates;
    if (cands.length === 0) return { selections: [], confidence: 0, warnings: ['无候选帧'] };
    if (!input.videoPath) return { selections: [], confidence: 0, warnings: ['无视频片段路径'] };

    const durSec = cands.length; // 1fps，candidates 数量 = 秒数
    const promptText = buildVideoFramePrompt(input.agentSlug, input.title ?? '', durSec);

    try {
      const videoBuffer = await readFile(input.videoPath);
      const b64 = videoBuffer.toString('base64');

      // 缓存
      const cacheFile = this.cfg.cacheDir
        ? join(this.cfg.cacheDir, `video-${cacheKey(this.cfg.model, promptText, b64)}.json`)
        : null;
      if (cacheFile) {
        const cached = await readFile(cacheFile, 'utf8')
          .then((s) => JSON.parse(s) as Record<string, unknown>)
          .catch(() => null);
        if (cached) {
          return this.mapSelections(cached, cands, input.agentSlug);
        }
      }

      // 调用 API
      const raw = this.cfg.baseUrl
        ? await this.callGateway(promptText, b64)
        : await this.callGeminiNative(promptText, b64);

      let obj: Record<string, unknown>;
      try {
        const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
        obj = JSON.parse((fenced ? fenced[1] : raw).trim());
        if (!obj || typeof obj !== 'object') throw new Error('not object');
      } catch {
        return { selections: [], confidence: 0, warnings: ['视频 VLM 输出非合法 JSON'] };
      }

      if (cacheFile) {
        await mkdir(dirname(cacheFile), { recursive: true });
        await writeFile(cacheFile, JSON.stringify(obj));
      }

      return this.mapSelections(obj, cands, input.agentSlug);
    } catch (e) {
      return { selections: [], confidence: 0, warnings: [String(e)] };
    }
  }

  async segmentSubtitles(subtitleText: string, durationSec: number): Promise<SubtitleSegmentsResult> {
    return this.mock.segmentSubtitles(subtitleText, durationSec);
  }

  /** 调用 Gemini 原生 API */
  private async callGeminiNative(promptText: string, videoB64: string): Promise<string> {
    const reqBody = JSON.stringify({
      contents: [{ parts: [{ text: promptText }, { inline_data: { mime_type: 'video/mp4', data: videoB64 } }] }],
      generationConfig: { temperature: 0 },
    });
    const reqFile = join(this.cfg.cacheDir ?? '/tmp', `gemini-req-${Date.now()}.json`);
    await mkdir(dirname(reqFile), { recursive: true });
    await writeFile(reqFile, reqBody);

    const proxyArg = buildCurlProxyArg();
    const raw = execSync(
      `curl -s ${proxyArg} --max-time 120 -X POST ` +
      `"https://generativelanguage.googleapis.com/v1beta/models/${this.cfg.model}:generateContent?key=${this.cfg.apiKey}" ` +
      `-H "Content-Type: application/json" -d @${reqFile}`,
      { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 },
    );

    try { await (await import('node:fs/promises')).unlink(reqFile); } catch { /* 清理失败忽略 */ }

    const data = JSON.parse(raw) as Record<string, unknown>;
    if (data.error) throw new Error(`Gemini API: ${JSON.stringify(data.error)}`);
    return (data.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }>)?.[0]
      ?.content?.parts?.map((p) => p.text).join('') ?? '';
  }

  /** 调用 OpenAI 兼容网关 */
  private async callGateway(promptText: string, videoB64: string): Promise<string> {
    const reqBody = JSON.stringify({
      model: this.cfg.model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: promptText },
          { type: 'video_url', video_url: { url: `data:video/mp4;base64,${videoB64}` } },
        ],
      }],
      temperature: 0,
      max_tokens: 2048,
    });

    const reqFile = join(this.cfg.cacheDir ?? '/tmp', `gateway-req-${Date.now()}.json`);
    await mkdir(dirname(reqFile), { recursive: true });
    await writeFile(reqFile, reqBody);

    const proxyArg = buildCurlProxyArg();
    let raw: string;
    try {
      raw = execSync(
        `curl -s ${proxyArg} --max-time 120 -X POST ` +
        `"${this.cfg.baseUrl}/chat/completions" ` +
        `-H "Content-Type: application/json" -H "Authorization: Bearer ${this.cfg.apiKey}" ` +
        `-d @${reqFile}`,
        { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 },
      );
    } catch (curlErr) {
      throw new Error(`网关请求失败: ${(curlErr as Error).message}`);
    }

    try { await (await import('node:fs/promises')).unlink(reqFile); } catch { /* 清理失败忽略 */ }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error(`网关非 JSON 响应: ${raw.slice(0, 500)}`);
    }
    if (data.error) throw new Error(`网关 API: ${JSON.stringify(data.error)}`);
    return (data.choices as Array<{ message?: { content?: string } }>)?.[0]?.message?.content ?? '';
  }

  /** 把 VLM 返回的时间戳映射到候选帧 */
  private mapSelections(obj: Record<string, unknown>, cands: { path: string; atSec: number }[], agentSlug: string): FrameSelectionResult {
    const warnings: string[] = [];
    const selections = [];
    for (const [role, val] of Object.entries(obj)) {
      if (val === null || typeof val !== 'object') continue;
      const item = val as { timeSec?: number; desc?: string };
      const timeSec = item.timeSec;
      if (typeof timeSec !== 'number' || !Number.isFinite(timeSec) || timeSec < 0) continue;
      const idx = Math.floor(timeSec);
      if (idx >= cands.length || idx < 0) {
        warnings.push(`${role} 时间戳 ${timeSec}s 超出候选帧范围`);
        continue;
      }
      selections.push({
        framePath: cands[idx].path,
        role,
        confidence: 0.5,
      });
    }
    return {
      selections,
      confidence: selections.length >= 2 ? 0.5 : selections.length > 0 ? 0.3 : 0,
      warnings,
    };
  }
}

/** 按 env 选 extractor */
export function videoExtractorFromEnv(cacheDir?: string): { extractor: LlmExtractor; label: string } | null {
  const cfg = videoLlmConfigFromEnv();
  if (!cfg) return null;
  return { extractor: new VideoLlmExtractor({ ...cfg, cacheDir }), label: `video-vlm(${cfg.model})` };
}
