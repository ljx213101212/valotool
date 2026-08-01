import { AGENTS, MAPS, parseQuery } from '@valotool/lineup-content';
import type { CapturedSegment, DraftLineup, PipelineCtx, SourceVideo } from '../types';

/**
 * CapturedSegment → DraftLineup。
 * 硬字段确定性来：用现有 parseQuery 从标题锁 side/site；
 * 软字段交 LLM extractor（多模态 VLM）。
 * VLM 预选 stand/aim/effect 帧作为默认值，人审可覆盖。
 */
export async function extract(
  seg: CapturedSegment,
  src: SourceVideo,
  ctx: PipelineCtx,
): Promise<DraftLineup> {
  ctx.log(`extract ${seg.segmentId}`);

  const parsed = parseQuery(seg.title ?? '');

  const soft = await ctx.extractor.extract({
    title: seg.title,
    subtitleText: seg.subtitleText,
    ocrText: [],
    images: seg.contactSheet ? [seg.contactSheet] : [],
    hints: src.hints,
    vocab: { maps: MAPS.map((m) => m.slug), agents: AGENTS.map((a) => a.slug) },
  });

  // 帧预选：优先视频分析 → fallback 到图像采样
  let frames: DraftLineup['frames'] = {};
  try {
    const videoEx = ctx.videoExtractor;
    if (videoEx && seg.clipPath) {
      const frameResult = await videoEx.selectFrames({
        candidates: seg.candidates,
        contactSheet: seg.contactSheet,
        videoPath: seg.clipPath,
        title: seg.title,
        agentSlug: src.hints?.agent ?? '',
      });
      for (const sel of frameResult.selections) {
        frames[sel.role] = sel.framePath;
      }
      if (frameResult.selections.length) {
        ctx.log(`  → 视频 VLM 预选了 ${frameResult.selections.length} 帧`);
      } else if (frameResult.warnings.length) {
        ctx.log(`  → 视频 VLM 无结果，警告: ${frameResult.warnings.join('; ')}`);
      }
    } else {
      const frameResult = await ctx.extractor.selectFrames({
        candidates: seg.candidates,
        contactSheet: seg.contactSheet,
        title: seg.title,
        agentSlug: src.hints?.agent ?? '',
      });
      for (const sel of frameResult.selections) {
        frames[sel.role] = sel.framePath;
      }
      if (frameResult.selections.length) {
        ctx.log(`  → VLM 预选了 ${frameResult.selections.length} 帧`);
      }
    }
  } catch {
    // selectFrames 失败不阻断
  }

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
    frames,
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
