import { access } from 'node:fs/promises';
import type { CapturedSegment, FrameCandidate, PipelineCtx, RawCapture, Segment } from '../types';
import {
  buildContactSheet,
  candidatesDir,
  contactSheetPath,
  extract1fps,
  listCandidates,
} from '../adapters/ffmpeg';

const MAX_SEC = 90; // 单段最长取帧时长，挡住时间轴空档造成的超长段

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
 * 不预先指派 stand/aim/effect：人审从接触表点格子选。
 * 幂等：已抽过的段复用磁盘上的帧。
 */
export async function captureFrames(seg: Segment, cap: RawCapture, ctx: PipelineCtx): Promise<CapturedSegment> {
  ctx.log(`capture ${seg.segmentId}`);
  const dur = Math.min(MAX_SEC, Math.max(1, seg.endSec - seg.startSec));
  const dir = candidatesDir(ctx.workDir, seg.segmentId);

  // 幂等：目录已有候选帧则复用，否则抽帧
  let paths = await listCandidates(dir).catch(() => [] as string[]);
  if (!paths.length) paths = await extract1fps(cap.videoPath, seg.startSec, dur, dir);

  const sheet = contactSheetPath(ctx.workDir, seg.segmentId);
  if (paths.length && !(await exists(sheet))) {
    await buildContactSheet(dir, paths.length, sheet);
  }

  // 第 i 张 ≈ startSec + i 秒（与接触表第 i 格对应）
  const candidates: FrameCandidate[] = paths.map((path, i) => ({ path, atSec: seg.startSec + i }));
  return { ...seg, candidates, contactSheet: paths.length ? sheet : undefined };
}
