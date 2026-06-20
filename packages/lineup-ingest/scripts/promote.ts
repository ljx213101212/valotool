/**
 * promote：把人审通过的草稿塌缩成正式 Lineup。
 *   staging/*.json 中 reviewStatus==='approved'
 *     → buildLineup（lineupSchema 校验）
 *     → 选中帧 copy 成 lineup-content/raw-images/{id}__{role}.png
 *     → 按 {map}-{agent}.json 合并进 lineup-content/data/lineups（去重+排序+MUST_LEARN_CAP 预检）
 * 之后照常： pnpm --filter @valotool/lineup-content ingest && ... check
 */
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lineupFileSchema, type Lineup } from '@valotool/lineup-content';
import type { DraftLineup, FrameRole } from '../src/types.ts';
import { buildLineup, mergeLineups, mustLearnViolations } from '../src/promote/core.ts';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const STAGING = join(PKG, 'staging');
const CONTENT = join(PKG, '..', 'lineup-content');
const DATA = join(CONTENT, 'data', 'lineups');
const RAW = join(CONTENT, 'raw-images');
const CDN_BASE = process.env.CDN_BASE ?? 'https://CDN_BASE_未配置';
const ROLES: FrameRole[] = ['stand', 'aim', 'effect'];

// 1) 收集 approved
const files = (await readdir(STAGING).catch(() => [])).filter((f) => f.endsWith('.json'));
const approved: DraftLineup[] = [];
for (const f of files) {
  const drafts = JSON.parse(await readFile(join(STAGING, f), 'utf8')) as DraftLineup[];
  approved.push(...drafts.filter((d) => d.reviewStatus === 'approved'));
}
if (!approved.length) {
  console.log('无 approved 草稿，无事可做。');
  process.exit(0);
}

// 2) buildLineup + 复制帧 + 按 map-agent 分组
const byKey = new Map<string, Lineup[]>();
let copied = 0;
await mkdir(RAW, { recursive: true });
for (const d of approved) {
  let lineup: Lineup;
  try {
    lineup = buildLineup(d, CDN_BASE);
  } catch (e) {
    console.error(`✗ ${d.draftId} 非法，跳过：${(e as Error).message.split('\n')[0]}`);
    continue;
  }
  for (const r of ROLES) {
    const src = d.frames[r];
    if (src) {
      await copyFile(join(PKG, src), join(RAW, `${lineup.id}__${r}.png`));
      copied++;
    }
  }
  byKey.set(`${lineup.map}-${lineup.agent}`, [...(byKey.get(`${lineup.map}-${lineup.agent}`) ?? []), lineup]);
}

// 3) 合并进 data/lineups
await mkdir(DATA, { recursive: true });
for (const [key, incoming] of byKey) {
  const file = join(DATA, `${key}.json`);
  const existing = await readFile(file, 'utf8')
    .then((s) => lineupFileSchema.parse(JSON.parse(s)))
    .catch(() => [] as Lineup[]);
  const merged = mergeLineups(existing, incoming);
  for (const v of mustLearnViolations(merged)) console.warn(`⚠ ${v}`);
  await writeFile(file, JSON.stringify(merged, null, 2) + '\n');
  console.log(`✓ data/lineups/${key}.json：+${incoming.length} → 共 ${merged.length} 条`);
}

console.log(
  `\n完成：${approved.length} 条 approved，复制 ${copied} 帧到 raw-images。\n` +
    `下一步：CDN_BASE=<你的CDN> pnpm --filter @valotool/lineup-content ingest 生成 webp 并上传，再 pnpm --filter @valotool/lineup-content check。`,
);
