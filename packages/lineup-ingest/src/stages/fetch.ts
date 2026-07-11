import type { PipelineCtx, RawCapture, SourceVideo } from '../types';
import { download } from '../adapters/bilibili';

/** SourceVideo → RawCapture（下载 + 解析字幕/章节） */
export async function fetchSource(src: SourceVideo, ctx: PipelineCtx): Promise<RawCapture> {
  ctx.log(`fetch ${src.id}`);
  const dl = await download(src, ctx.workDir);
  return {
    source: src,
    videoPath: dl.videoPath,
    subtitlePath: dl.subtitlePath,
    chapters: dl.chapters,
    durationSec: dl.durationSec,
  };
}
