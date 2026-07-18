import { execFile } from 'node:child_process';
import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
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

async function exists(p: string): Promise<boolean> {
  try { await access(p); return true; } catch { return false; }
}

interface MetaCache {
  chapters: Chapter[];
  duration: number;
}

/**
 * 下载视频 + 提取章节和字幕。
 * 幂等：视频、meta 缓存、字幕各自独立检查。
 */
export async function download(source: SourceVideo, workDir: string): Promise<DownloadResult> {
  await mkdir(workDir, { recursive: true });

  // ── 下载视频 ──
  let videoPath = await findVideo(workDir);
  if (!videoPath) {
    await exec(
      'yt-dlp',
      [
        '--cookies-from-browser', COOKIES_BROWSER,
        '--no-playlist', '--no-warnings', '--no-progress', '--retries', '3',
        '-S', 'vcodec:avc',
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

  // ── 提取章节元数据（幂等、缓存）──
  const metaPath = join(workDir, 'meta.json');
  let meta: MetaCache = { chapters: [], duration: 0 };
  if (await exists(metaPath)) {
    meta = JSON.parse(await readFile(metaPath, 'utf8'));
  } else {
    try {
      const { stdout } = await exec(
        'yt-dlp',
        [
          '--dump-json', '--skip-download', '--no-warnings',
          '--cookies-from-browser', COOKIES_BROWSER,
          source.url,
        ],
        { maxBuffer: 1024 * 1024 * 64 },
      );
      const data = JSON.parse(stdout.trim());
      meta.chapters = (data.chapters ?? []).map((c: Record<string, unknown>, i: number) => ({
        index: i,
        startSec: Math.round((c.start_time as number) ?? 0),
        endSec: Math.round((c.end_time as number) ?? 0),
        title: String(c.title ?? ''),
      }));
      meta.duration = Math.round((data.duration as number) ?? 0);
      await writeFile(metaPath, JSON.stringify(meta));
    } catch {
      // 无章节元数据不是致命错误
    }
  }

  // ── 下载字幕（幂等）──
  /** B站：ai-zh(AI字幕) > zh-Hans(手动字幕)；其它平台 zh-Hans 优先 */
  const SUB_LANGS = ['ai-zh', 'zh-Hans'];

  let subtitlePath: string | undefined;
  if (!subtitlePath) {
    // 先检查磁盘上是否已有任一语言的字幕文件
    for (const lang of SUB_LANGS) {
      for (const ext of ['.vtt', '.srt']) {
        const p = join(workDir, `subs.${lang}${ext}`);
        if (await exists(p)) { subtitlePath = p; break; }
      }
      if (subtitlePath) break;
    }
  }
  if (!subtitlePath) {
    for (const lang of SUB_LANGS) {
      for (const flag of ['--write-subs', '--write-auto-subs'] as const) {
        try {
          await exec(
            'yt-dlp',
            [
              flag, '--sub-lang', lang,
              '--skip-download', '--no-warnings', '--no-progress',
              '--cookies-from-browser', COOKIES_BROWSER,
              '-o', join(workDir, 'subs'),
              source.url,
            ],
            { maxBuffer: 1024 * 1024 * 64 },
          );
          for (const ext of ['.vtt', '.srt']) {
            const p = join(workDir, `subs.${lang}${ext}`);
            if (await exists(p)) { subtitlePath = p; break; }
          }
          if (subtitlePath) break;
        } catch {
          // 该组合不可用，试下一个
        }
      }
      if (subtitlePath) break;
    }
  }

  const durationSec = meta.duration || await probeDuration(videoPath);
  return { videoPath, subtitlePath, chapters: meta.chapters, durationSec };
}
