import '../env';
import { createServer, type IncomingMessage } from 'node:http';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyReview, suggestDefaults, validateForApproval, type ReviewPatch } from './core';
import { getAgentFrameRoles, AGENTS } from '@valotool/lineup-content';
import type { DraftLineup, SourceVideo } from '../types';
import { sourceVideoSchema } from '../types';
import { fetchSource } from '../stages/fetch';
import { segment } from '../stages/segment';
import { captureFrames } from '../stages/capture';
import { extract } from '../stages/extract';
import { videoExtractorFromEnv } from '../extractors/video-vlm';
import { extractorFromEnv } from '../extractors/vlm';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = resolve(HERE, '..', '..');
const STAGING = join(PKG, 'staging');
const WORK = join(PKG, '.work');
const PORT = Number(process.env.PORT ?? 5180);

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json',
};

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((res, rej) => {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => res(b));
    req.on('error', rej);
  });
}

async function loadStaging(file: string): Promise<DraftLineup[]> {
  return JSON.parse(await readFile(join(STAGING, file), 'utf8')) as DraftLineup[];
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const p = url.pathname;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && p === '/') {
      res.writeHead(200, { 'content-type': MIME['.html'] });
      res.end(await readFile(join(HERE, 'review.html')));
      return;
    }

    if (req.method === 'GET' && p === '/api/drafts') {
      const files = (await readdir(STAGING).catch(() => [])).filter((f) => f.endsWith('.json'));
      const flat: unknown[] = [];
      for (const file of files) {
        for (const d of await loadStaging(file)) {
          const fields = suggestDefaults(d);
          const frameRoles = getAgentFrameRoles(fields.agent ?? '');
          flat.push({ file, ...d, fields, frameRoles });
        }
      }
      res.writeHead(200, { 'content-type': MIME['.json'] });
      res.end(JSON.stringify(flat));
      return;
    }

    if (req.method === 'GET' && p === '/api/config') {
      const config = Object.fromEntries(
        AGENTS.map((a) => [a.slug, { agent: a, frameRoles: getAgentFrameRoles(a.slug) }]),
      );
      res.writeHead(200, { 'content-type': MIME['.json'] });
      res.end(JSON.stringify(config));
      return;
    }

    if (req.method === 'POST' && p === '/api/draft') {
      const { file, draftId, patch } = JSON.parse(await readBody(req)) as {
        file: string;
        draftId: string;
        patch: ReviewPatch;
      };
      const drafts = await loadStaging(file);
      const idx = drafts.findIndex((d) => d.draftId === draftId);
      if (idx < 0) {
        res.writeHead(404);
        res.end('draft not found');
        return;
      }
      // 始终先合并字段/帧编辑
      let merged = applyReview(drafts[idx], { fields: patch.fields, frames: patch.frames });
      let result: { ok: boolean; issues: string[] } = { ok: true, issues: [] };
      if (patch.reviewStatus === 'approved') {
        const v = validateForApproval(merged);
        if (v.ok) merged = applyReview(merged, { reviewStatus: 'approved' });
        else result = v; // 校验不过：保持 pending，回报缺失字段
      } else if (patch.reviewStatus) {
        merged = applyReview(merged, { reviewStatus: patch.reviewStatus });
      }
      drafts[idx] = merged;
      await writeFile(join(STAGING, file), JSON.stringify(drafts, null, 2));
      res.writeHead(200, { 'content-type': MIME['.json'] });
      res.end(JSON.stringify({ ...result, draft: merged }));
      return;
    }

    // 静态：/work/* → .work/*（防路径越界）
    if (req.method === 'GET' && p.startsWith('/work/')) {
      const abs = resolve(WORK, decodeURIComponent(p.slice('/work/'.length)));
      if (!abs.startsWith(WORK + '/')) {
        res.writeHead(403);
        res.end('forbidden');
        return;
      }
      const data = await readFile(abs).catch(() => null);
      if (!data) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      res.writeHead(200, { 'content-type': MIME[abs.slice(abs.lastIndexOf('.'))] ?? 'application/octet-stream' });
      res.end(data);
      return;
    }

    // POST /api/source-video — 接收油猴 SourceVideo JSON，执行 fetch + capture
    if (req.method === 'POST' && p === '/api/source-video') {
      const body = await readBody(req);
      let src: unknown;
      try { src = JSON.parse(body); } catch {
        res.writeHead(400, { 'content-type': MIME['.json'] });
        res.end(JSON.stringify({ error: 'JSON 解析失败' }));
        return;
      }
      const parsed = sourceVideoSchema.safeParse(src);
      if (!parsed.success) {
        res.writeHead(400, { 'content-type': MIME['.json'] });
        res.end(JSON.stringify({ error: 'SourceVideo 校验失败', details: parsed.error.issues }));
        return;
      }
      const source: SourceVideo = parsed.data;
      const { extractor } = extractorFromEnv(join(WORK, '.vlm-cache'));
      const ctx = { workDir: join(WORK, source.id), extractor, log: () => {} };
      try {
        const cap = await fetchSource(source, ctx);
        const segs = await segment(cap, ctx);
        const captured = [];
        for (const seg of segs) {
          captured.push(await captureFrames(seg, cap, ctx));
        }
        res.writeHead(200, { 'content-type': MIME['.json'] });
        res.end(JSON.stringify({
          videoId: source.id,
          title: source.title,
          segments: captured.map((c) => ({
            segmentId: c.segmentId,
            title: c.title,
            startSec: c.startSec,
            endSec: c.endSec,
            candidateCount: c.candidates.length,
            clipPath: c.clipPath,
            contactSheet: c.contactSheet,
          })),
        }));
      } catch (e) {
        res.writeHead(500, { 'content-type': MIME['.json'] });
        res.end(JSON.stringify({ error: String(e) }));
      }
      return;
    }

    // POST /api/video-analyze — 对指定段调用 Gemini 视频分析，返回帧预选
    if (req.method === 'POST' && p === '/api/video-analyze') {
      const { videoId, segmentId, title, agentSlug } = JSON.parse(await readBody(req)) as {
        videoId: string; segmentId: string; title: string; agentSlug: string;
      };
      const videoEx = videoExtractorFromEnv(join(WORK, '.vlm-cache'));
      if (!videoEx) {
        res.writeHead(400, { 'content-type': MIME['.json'] });
        res.end(JSON.stringify({ error: '未配置 GEMINI_API_KEY' }));
        return;
      }
      const ctx = { workDir: join(WORK, videoId), extractor: videoEx.extractor, log: console.log };
      const segDir = join(WORK, videoId);
      // 从 staging 读已有的 candidates
      const stagingFile = join(STAGING, `${videoId}.json`);
      const drafts = (await readFile(stagingFile, 'utf8').then((s) => JSON.parse(s) as DraftLineup[]).catch(() => []));
      const existing = drafts.find((d) => d.draftId === segmentId);
      const candidates = existing?.candidates ?? [];
      const clipPath = join(segDir, 'clips', `${segmentId}.mp4`);

      try {
        const result = await videoEx.extractor.selectFrames({
          candidates,
          videoPath: clipPath,
          title,
          agentSlug,
        });
        res.writeHead(200, { 'content-type': MIME['.json'] });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(500, { 'content-type': MIME['.json'] });
        res.end(JSON.stringify({ error: String(e) }));
      }
      return;
    }

    res.writeHead(404);
    res.end('not found');
  } catch (e) {
    res.writeHead(500);
    res.end(String(e));
  }
});

server.listen(PORT, () => console.log(`人审 UI 已启动：http://localhost:${PORT}  （staging=${STAGING}）`));
