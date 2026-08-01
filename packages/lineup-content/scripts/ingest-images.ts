/**
 * 截图入库脚本：把原始截图转成多尺寸 WebP，并打印内容 JSON 应填的 URL。
 *
 * 输入：raw-images/ 下按 `{点位id}__{stand|aim|effect}.png|jpg|jpeg` 命名的原图。
 * 输出：images/{点位id}/{role}.webp（卡片大图，宽 1600）
 *       images/{点位id}/{role}.thumb.webp（列表缩略图，宽 480）
 *
 * raw-images/ 与 images/ 均不入 git；images/ 整目录上传对象存储（如腾讯云 COS），
 * 内容 JSON 里的 url = `${CDN_BASE}/{点位id}/{role}.webp`。
 *
 * 用法：pnpm --filter @valotool/lineup-content ingest
 *       CDN_BASE=https://cdn.example.com pnpm --filter @valotool/lineup-content ingest
 */
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { ALL_LINEUPS } from '../src/data/index.ts';
import { IMAGE_ROLES } from '../src/schema.ts';

// 加载 .env.local / .env（与 lineup-ingest 共用根目录 env 文件）
function loadEnv() {
  const root = dirname(fileURLToPath(import.meta.url));
  let dir = root;
  for (;;) {
    for (const name of ['.env.local', '.env']) {
      const f = join(dir, name);
      if (!existsSync(f)) continue;
      for (const line of readFileSync(f, 'utf8').split('\n')) {
        const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (!m) continue;
        const key = m[1];
        let val = m[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (process.env[key] === undefined) process.env[key] = val;
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
}
loadEnv();

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = join(PKG_ROOT, 'raw-images');
const OUT_DIR = join(PKG_ROOT, 'images');
const CDN_BASE = process.env.CDN_BASE ?? 'https://CDN_BASE_未配置';

const FILE_RE = /^([a-z0-9-]+)__(stand|aim|effect)\.(png|jpe?g)$/;
const lineupIds = new Set(ALL_LINEUPS.map((l) => l.id));

let names: string[];
try {
  names = (await readdir(RAW_DIR)).filter((n) => !n.startsWith('.'));
} catch {
  console.error(`未找到原图目录 ${RAW_DIR}\n请创建该目录并放入 {点位id}__{role}.png 命名的截图。`);
  process.exit(1);
}

const errors: string[] = [];
const done: { id: string; role: string }[] = [];

for (const name of names.sort()) {
  const m = name.match(FILE_RE);
  if (!m) {
    errors.push(`命名不合规（应为 {点位id}__{stand|aim|effect}.png）: ${name}`);
    continue;
  }
  const [, id, role] = m;
  if (!lineupIds.has(id)) {
    errors.push(`点位 id 不存在于内容数据: ${name}`);
    continue;
  }
  const outDir = join(OUT_DIR, id);
  await mkdir(outDir, { recursive: true });
  const src = sharp(join(RAW_DIR, name));
  await src.clone().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 })
    .toFile(join(outDir, `${role}.webp`));
  await src.clone().resize({ width: 480 }).webp({ quality: 70 })
    .toFile(join(outDir, `${role}.thumb.webp`));
  done.push({ id, role });
}

for (const e of errors) console.error(`❌ ${e}`);

if (done.length > 0) {
  console.log(`\n✅ 已处理 ${done.length} 张图 -> images/\n`);
  // 按点位分组，打印应回填进内容 JSON 的 images 片段
  const byId = new Map<string, string[]>();
  for (const d of done) {
    byId.set(d.id, [...(byId.get(d.id) ?? []), d.role]);
  }
  for (const [id, roles] of byId) {
    const ordered = [...IMAGE_ROLES].filter((r) => roles.includes(r));
    console.log(`${id}:`);
    for (const role of ordered) {
      console.log(`  { "role": "${role}", "url": "${CDN_BASE}/${id}/${role}.webp" }`);
    }
    const missing = IMAGE_ROLES.filter((r) => !roles.includes(r));
    if (missing.length) console.log(`  （缺 ${missing.join('/')}，如该点位本就不需要可忽略）`);
  }
}

if (errors.length > 0) process.exit(1);
