import { execFile } from 'node:child_process';
import { mkdir, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';

const exec = promisify(execFile);

// ───────────────────────── 路径 ─────────────────────────

export function candidatesDir(workDir: string, segmentId: string): string {
  return join(workDir, 'frames', segmentId);
}

export function contactSheetPath(workDir: string, segmentId: string): string {
  return join(workDir, 'contact', `${segmentId}.png`);
}

const CAND_RE = /^c\d+\.png$/;

// ───────────────────────── 抽帧 ─────────────────────────

/** 在 atSec 抽单帧到 outPath（-ss 在 -i 前 = 快速定位）。供 step2 按需取全分辨率帧。 */
export async function extractFrame(videoPath: string, atSec: number, outPath: string): Promise<string> {
  await mkdir(dirname(outPath), { recursive: true });
  await exec('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-ss', String(atSec),
    '-i', videoPath,
    '-frames:v', '1', '-q:v', '2',
    outPath,
  ]);
  return outPath;
}

/** 1fps 抽出整段候选帧到 outDir/c000.png…，返回写出的文件路径（排序）。 */
export async function extract1fps(
  videoPath: string,
  startSec: number,
  durSec: number,
  outDir: string,
): Promise<string[]> {
  await mkdir(outDir, { recursive: true });
  await exec('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-ss', String(startSec),
    '-i', videoPath,
    '-t', String(durSec),
    '-vf', 'fps=1', '-q:v', '2',
    join(outDir, 'c%03d.png'),
  ]);
  return listCandidates(outDir);
}

/** 列出某段已抽的候选帧（排序） */
export async function listCandidates(outDir: string): Promise<string[]> {
  const files = (await readdir(outDir)).filter((f) => CAND_RE.test(f)).sort();
  return files.map((f) => join(outDir, f));
}

/** 把已抽的 1fps 帧（outDir/c%03d.png）拼成接触表，每行 6 张。 */
export async function buildContactSheet(outDir: string, count: number, outPath: string): Promise<string> {
  await mkdir(dirname(outPath), { recursive: true });
  const cols = 6;
  const rows = Math.max(1, Math.ceil(count / cols));
  await exec('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-start_number', '1',
    '-i', join(outDir, 'c%03d.png'),
    '-frames:v', '1',
    '-vf', `scale=240:-1,tile=${cols}x${rows}`,
    outPath,
  ]);
  return outPath;
}
