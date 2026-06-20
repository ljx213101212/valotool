import { AGENTS, MAPS, parseQuery } from '@valotool/lineup-content';
import type { CapturedSegment, DraftLineup, PipelineCtx, SourceVideo } from '../types';

/**
 * CapturedSegment → DraftLineup。
 * 硬字段确定性来：用现有 parseQuery 从标题锁 side/site；
 * 软字段交 LLM extractor。OCR 待人审选定帧后再跑（不在候选全集上跑）。
 * 三帧不在此指派，挂上 candidates + 接触表交人审。
 */
export async function extract(
  seg: CapturedSegment,
  src: SourceVideo,
  ctx: PipelineCtx,
): Promise<DraftLineup> {
  ctx.log(`extract ${seg.segmentId}`);

  const parsed = parseQuery(seg.title ?? '');

  const soft = await ctx.extractor.extract({
    subtitleText: seg.subtitleText,
    ocrText: [],
    hints: src.hints,
    vocab: { maps: MAPS.map((m) => m.slug), agents: AGENTS.map((a) => a.slug) },
  });

  const warnings = [...soft.warnings];
  if (!parsed.side) warnings.push('未能从标题确定 side');
  if (!parsed.site) warnings.push('未能从标题确定 site');

  return {
    draftId: seg.segmentId,
    fields: {
      ...soft.fields,
      map: src.hints?.map,
      agent: src.hints?.agent,
      side: parsed.side,
      site: parsed.site,
      title: seg.title,
      verifiedPatch: src.recordedPatch,
    },
    frames: {}, // 人审从 candidates 指派
    candidates: seg.candidates,
    contactSheet: seg.contactSheet,
    provenance: {
      videoId: src.id,
      url: src.url,
      creator: src.creator,
      startSec: seg.startSec,
      endSec: seg.endSec,
    },
    confidence: soft.confidence,
    warnings,
    reviewStatus: 'pending',
  };
}
