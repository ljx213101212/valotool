import { execFile } from 'node:child_process';
import { mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { Chapter, SourceVideo } from '../types';

const exec = promisify(execFile);

/** B站有风控（HTTP 412），需登录态 cookie。默认从 Chrome 读，可用环境变量覆盖。 */
const COOKIES_BROWSER = process.env.INGEST_COOKIES_BROWSER ?? 'chrome';

export interface DownloadResult {
  videoPath: string;
  subtitlePath?: string;
  chapters: Chapter[];
  durationSec: number;
}

async function findVideo(dir: string): Promise<string | null> {
  try {
    const files = await readdir(dir);
    const v = files.find(
      (f) => f.startsWith('video.') && !f.endsWith('.part') && !f.endsWith('.ytdl'),
    );
    return v ? join(dir, v) : null;
  } catch {
    return null;
  }
}

async function probeDuration(videoPath: string): Promise<number> {
  const { stdout } = await exec('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    videoPath,
  ]);
  return Math.round(parseFloat(stdout.trim()) || 0);
}

/**
 * 下载视频（仅视频流即可，抽帧不需音轨）+ 探测时长。
 * 幂等：workDir 已有 video.* 则跳过下载。章节暂不依赖（用手抄时间轴切片）。
 */
export async function download(source: SourceVideo, workDir: string): Promise<DownloadResult> {
  await mkdir(workDir, { recursive: true });

  let videoPath = await findVideo(workDir);
  if (!videoPath) {
    await exec(
      'yt-dlp',
      [
        '--cookies-from-browser', COOKIES_BROWSER,
        '--no-playlist', '--no-warnings', '--no-progress', '--retries', '3',
        '-f', 'bv*[height<=720]/bv*/b',
        '--remux-video', 'mp4',
        '-o', join(workDir, 'video.%(ext)s'),
        source.url,
      ],
      { maxBuffer: 1024 * 1024 * 64 },
    );
    videoPath = await findVideo(workDir);
    if (!videoPath) throw new Error(`下载完成但未找到视频文件于 ${workDir}`);
  }

  const durationSec = await probeDuration(videoPath);
  return { videoPath, chapters: [], durationSec };
}
