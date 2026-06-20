import type { PipelineCtx, RawCapture, Segment } from '../types';

/**
 * RawCapture → Segment[]。优先级：手抄时间轴 > 章节 > 自动检测。
 * 手抄时间轴这条路径是真实可用的（我们的 sources/*.json 走这条）。
 */
export async function segment(cap: RawCapture, ctx: PipelineCtx): Promise<Segment[]> {
  ctx.log(`segment ${cap.source.id}`);

  const manual = cap.source.segments;
  if (manual && manual.length) {
    return manual.map((m, i) => ({
      videoId: cap.source.id,
      segmentId: `${cap.source.id}-${i}`,
      startSec: m.startSec,
      endSec: manual[i + 1]?.startSec ?? cap.durationSec,
      title: m.title,
      subtitleText: '', // TODO: 按 [startSec,endSec) 窗口从字幕截取
    }));
  }

  if (cap.chapters.length) {
    return cap.chapters.map((c) => ({
      videoId: cap.source.id,
      segmentId: `${cap.source.id}-${c.index}`,
      startSec: c.startSec,
      endSec: c.endSec,
      title: c.title,
      subtitleText: '',
    }));
  }

  throw new Error('TODO segment: 无手抄时间轴/章节时，用字幕停顿 + 场景切变自动切片');
}
