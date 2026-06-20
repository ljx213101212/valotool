import type { DraftLineup, PipelineCtx, SourceVideo } from './types';
import { fetchSource } from './stages/fetch';
import { segment } from './stages/segment';
import { captureFrames } from './stages/capture';
import { extract } from './stages/extract';
import { stageDrafts } from './stages/stage';

export type { PipelineCtx } from './types';

/**
 * 单视频全流程：fetch → segment → (capture → extract)* → stage。
 * 每 stage 落盘工件，崩溃/限流重跑可恢复（落盘逻辑待各 adapter 补）。
 */
export async function runSource(
  src: SourceVideo,
  ctx: PipelineCtx,
  stagingPath: string,
): Promise<DraftLineup[]> {
  const cap = await fetchSource(src, ctx);
  const segs = await segment(cap, ctx);
  const drafts: DraftLineup[] = [];
  for (const seg of segs) {
    const captured = await captureFrames(seg, cap, ctx);
    drafts.push(await extract(captured, src, ctx));
  }
  await stageDrafts(drafts, stagingPath, ctx);
  return drafts;
}
