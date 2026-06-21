import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { DraftLineup, PipelineCtx } from '../types';

/**
 * 合并新抽取与既有 staging：**保留人审过的（approved/rejected）**，
 * 仅 pending 用新结果覆盖。这样重抽（如换 VLM 预填）不会清掉人工成果。
 */
export function mergeStaging(existing: DraftLineup[], fresh: DraftLineup[]): DraftLineup[] {
  const reviewed = new Map(
    existing.filter((d) => d.reviewStatus !== 'pending').map((d) => [d.draftId, d] as const),
  );
  return fresh.map((d) => reviewed.get(d.draftId) ?? d);
}

/**
 * DraftLineup[] → staging/<bvid>.json（人审前不进正式数据），保留既有人审。
 * TODO: 用 RAG 同款 embedding 与 data/lineups 既有条目算余弦查重。
 */
export async function stageDrafts(
  drafts: DraftLineup[],
  outPath: string,
  ctx: PipelineCtx,
): Promise<{ written: number; preserved: number }> {
  const existing = await readFile(outPath, 'utf8')
    .then((s) => JSON.parse(s) as DraftLineup[])
    .catch(() => [] as DraftLineup[]);
  const merged = mergeStaging(existing, drafts);
  const preserved = merged.filter((d) => d.reviewStatus !== 'pending').length;
  ctx.log(`stage ${drafts.length} drafts（保留人审 ${preserved}）-> ${outPath}`);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(merged, null, 2));
  return { written: merged.length, preserved };
}
