import { readFile } from 'node:fs/promises';
import type { PipelineCtx, RawCapture, Segment } from '../types';
import { parseChaptersFromSubtitleText } from '../adapters/subtitle';

/** 判断 gap 分段结果是否质量太差，需要 VLM 语义分段兜底 */
function needsVlmFallback(chapters: { startSec: number; endSec: number; title: string }[], durationSec: number): boolean {
  if (chapters.length === 0) return true;
  // 段数太少 且 平均段长 > 30s → 大概率漏段
  if (chapters.length <= 2 && durationSec > 60) return true;
  // 有超过 60s 的长段 → 可能包含多个点位
  if (chapters.some((c) => c.endSec - c.startSec > 60)) return true;
  return false;
}

/**
 * RawCapture → Segment[]。
 * 优先级：手抄时间轴 > 章节 > 字幕停顿分段 > VLM 语义分段 > 报错。
 */
export async function segment(cap: RawCapture, ctx: PipelineCtx): Promise<Segment[]> {
  ctx.log(`segment ${cap.source.id}`);

  // 1. 手抄时间轴（最高优先级）
  const manual = cap.source.segments;
  if (manual && manual.length) {
    ctx.log(`  → 手抄时间轴（${manual.length} 段）`);
    return manual.map((m, i) => ({
      videoId: cap.source.id,
      segmentId: `${cap.source.id}-${i}`,
      startSec: m.startSec,
      endSec: manual[i + 1]?.startSec ?? cap.durationSec,
      title: m.title,
      subtitleText: '',
    }));
  }

  // 2. 章节信息
  if (cap.chapters.length) {
    ctx.log(`  → 章节信息（${cap.chapters.length} 段）`);
    return cap.chapters.map((c) => ({
      videoId: cap.source.id,
      segmentId: `${cap.source.id}-${c.index}`,
      startSec: c.startSec,
      endSec: c.endSec,
      title: c.title,
      subtitleText: '',
    }));
  }

  // 3. 字幕停顿分段（gap-based）
  if (cap.subtitlePath) {
    const raw = await readFile(cap.subtitlePath, 'utf8').catch(() => '');
    const chs = parseChaptersFromSubtitleText(raw, cap.durationSec);

    if (chs.length && !needsVlmFallback(chs, cap.durationSec)) {
      ctx.log(`  → 字幕停顿分段（${chs.length} 段）`);
      return toSegments(cap.source.id, chs);
    }

    // 4. VLM 语义分段（gap 质量差时兜底）
    if (raw) {
      try {
        const result = await ctx.extractor.segmentSubtitles(raw, cap.durationSec);
        if (result.segments.length) {
          ctx.log(`  → VLM 语义分段（${result.segments.length} 段）${result.warnings.length ? ` +${result.warnings.length} 警告` : ''}`);
          return toSegments(cap.source.id, result.segments);
        }
      } catch {
        ctx.log('  → VLM 语义分段异常');
      }
    }

    // VLM 失败时回退到 gap 结果（至少有个东西用）
    if (chs.length) {
      ctx.log(`  → 回退到字幕停顿分段（${chs.length} 段）`);
      return toSegments(cap.source.id, chs);
    }
  }

  throw new Error('segment: 无手抄时间轴、无章节、无可用字幕，无法分段');
}

function toSegments(videoId: string, chapters: { index: number; startSec: number; endSec: number; title: string }[]): Segment[] {
  return chapters.map((c) => ({
    videoId,
    segmentId: `${videoId}-${c.index}`,
    startSec: c.startSec,
    endSec: c.endSec,
    title: c.title,
    subtitleText: '',
  }));
}
