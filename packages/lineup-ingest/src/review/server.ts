import '../env';
import { createServer, type IncomingMessage } from 'node:http';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyReview, suggestDefaults, validateForApproval, type ReviewPatch } from './core';
import type { DraftLineup } from '../types';

const HERE = dirname(fileURLToPath(import.meta.url));
const CWD = process.cwd();
const STAGING = join(CWD, 'staging');
const WORK = resolve(CWD, '.work');
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
          flat.push({ file, ...d, fields: suggestDefaults(d) });
        }
      }
      res.writeHead(200, { 'content-type': MIME['.json'] });
      res.end(JSON.stringify(flat));
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

    res.writeHead(404);
    res.end('not found');
  } catch (e) {
    res.writeHead(500);
    res.end(String(e));
  }
});

server.listen(PORT, () => console.log(`人审 UI 已启动：http://localhost:${PORT}  （staging=${STAGING}）`));
