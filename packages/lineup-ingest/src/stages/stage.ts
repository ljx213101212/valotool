import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { DraftLineup, PipelineCtx } from '../types';

/**
 * DraftLineup[] → staging/<bvid>.json（人审前不进正式数据）。
 * TODO: 用 RAG 同款 embedding 与 data/lineups 既有条目算余弦查重，
 *       超阈值标 flaggedDup（不自动丢，留人审定夺）。
 */
export async function stageDrafts(
  drafts: DraftLineup[],
  outPath: string,
  ctx: PipelineCtx,
): Promise<{ written: number; flaggedDup: number }> {
  ctx.log(`stage ${drafts.length} drafts -> ${outPath}`);
  const flaggedDup = 0; // TODO: 查重
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(drafts, null, 2));
  return { written: drafts.length, flaggedDup };
}
