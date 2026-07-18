/**
 * eval：以人审 approved 草稿的软字段为 ground truth，跑 extractor 抽取并对比。
 * 类别字段（abilitySlot/technique）算命中率；自由文本并排展示供人工判。
 *
 * 用法：
 *   pnpm --filter @valotool/lineup-ingest eval                 # mock（占位，全空）
 *   INGEST_EXTRACTOR=vlm VLM_API_KEY=sk-... \
 *     pnpm --filter @valotool/lineup-ingest eval               # 真 VLM
 */
import '../src/env.ts';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AGENTS, MAPS } from '@valotool/lineup-content';
import type { DraftLineup } from '../src/types.ts';
import { extractorFromEnv } from '../src/extractors/vlm.ts';
import { categoricalAccuracy, compareFields, type FieldComparison } from '../src/eval/score.ts';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const STAGING = join(PKG, 'staging');

const { extractor, label } = extractorFromEnv(join(PKG, '.work', '.vlm-cache'));
console.log(`extractor = ${label}\n`);

const files = (await readdir(STAGING).catch(() => [])).filter((f) => f.endsWith('.json'));
const truth: DraftLineup[] = [];
for (const f of files) {
  const d = JSON.parse(await readFile(join(STAGING, f), 'utf8')) as DraftLineup[];
  truth.push(...d.filter((x) => x.reviewStatus === 'approved'));
}
if (!truth.length) {
  console.log('无 approved ground truth——先去人审几条再来 eval。');
  process.exit(0);
}

console.log(`ground truth：${truth.length} 条\n`);
const rows: FieldComparison[][] = [];
for (const g of truth) {
  const pred = await extractor.extract({
    title: g.fields.title,
    subtitleText: '',
    ocrText: [],
    images: g.contactSheet ? [join(PKG, g.contactSheet)] : [],
    hints: { map: g.fields.map, agent: g.fields.agent },
    vocab: { maps: MAPS.map((m) => m.slug), agents: AGENTS.map((a) => a.slug) },
  });
  const cmp = compareFields(g.fields, pred.fields);
  rows.push(cmp);
  console.log(`# ${g.draftId}  ${g.fields.title ?? ''}`);
  for (const c of cmp) {
    const mark = c.hit === undefined ? ' ' : c.hit ? '✓' : '✗';
    console.log(`  ${mark} ${c.field.padEnd(12)} 人审: ${c.truth ?? '—'}    VLM: ${c.pred ?? '—'}`);
  }
  if (pred.warnings.length) console.log(`  ⚠ ${pred.warnings.join('; ')}`);
  console.log();
}

console.log('类别字段命中率：');
for (const a of categoricalAccuracy(rows)) console.log(`  ${a.field}: ${a.hit}/${a.total}`);
