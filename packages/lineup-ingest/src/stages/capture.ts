import { access } from 'node:fs/promises';
import type { CapturedSegment, FrameCandidate, PipelineCtx, RawCapture, Segment } from '../types';
import {
  buildContactSheet,
  candidatesDir,
  clipPath,
  contactSheetPath,
  extractClip,
  extract1fps,
  listCandidates,
} from '../adapters/ffmpeg';

const MAX_SEC = 90; // 单段最长取帧时长，挡住时间轴空档造成的超长段

/** 候选帧 → {path, atSec}。第 i 张 = 段起点后第 i 秒（与接触表第 i 格对应）。纯函数，便于测试。 */
export function toCandidates(paths: string[], startSec: number): FrameCandidate[] {
  return paths.map((path, i) => ({ path, atSec: startSec + i }));
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Segment → CapturedSegment。
 * 1fps 抽出整段候选帧，再用同一批帧拼接触表 —— 格子与候选 1:1 对齐。
 * 同时裁剪视频片段供视频分析 extractor 使用。
 * 幂等：已抽过的段复用磁盘上的帧和 clip。
 */
export async function captureFrames(seg: Segment, cap: RawCapture, ctx: PipelineCtx): Promise<CapturedSegment> {
  ctx.log(`capture ${seg.segmentId}`);
  const dur = Math.min(MAX_SEC, Math.max(1, seg.endSec - seg.startSec));
  const dir = candidatesDir(ctx.workDir, seg.segmentId);

  // 候选帧：幂等
  let paths = await listCandidates(dir).catch(() => [] as string[]);
  if (!paths.length) paths = await extract1fps(cap.videoPath, seg.startSec, dur, dir);

  // 接触表：幂等
  const sheet = contactSheetPath(ctx.workDir, seg.segmentId);
  if (paths.length && !(await exists(sheet))) {
    await buildContactSheet(dir, paths.length, sheet);
  }

  // 视频片段：幂等
  const cPath = clipPath(ctx.workDir, seg.segmentId);
  if (!(await exists(cPath))) {
    await extractClip(cap.videoPath, seg.startSec, dur, cPath);
  }

  const candidates = toCandidates(paths, seg.startSec);
  return { ...seg, candidates, contactSheet: paths.length ? sheet : undefined, clipPath: cPath };
}
