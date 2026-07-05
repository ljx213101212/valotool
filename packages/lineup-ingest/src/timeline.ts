export interface ParsedSegment {
  startSec: number;
  title: string;
}

export interface TimelineParse {
  segments: ParsedSegment[];
  /** 无法识别时间戳的行（原样返回，供提示） */
  skipped: string[];
}

// 行首时间戳：可选时、分:秒，后跟可选分隔符与标题
const LINE = /^(?:(\d+):)?(\d{1,2}):(\d{2})\s*[-–—.、:]*\s*(.*\S)?\s*$/;

/**
 * 把粘贴的时间轴文本解析为 segments。
 * 支持 `m:ss`、`mm:ss`、`h:mm:ss`；分隔符 `-`/`.`/`、`/`:`；无时间戳的行进 skipped。
 * mm:ss → 秒。不做递增校验（交调用方提示）。
 */
export function parseTimeline(text: string): TimelineParse {
  const segments: ParsedSegment[] = [];
  const skipped: string[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(LINE);
    if (!m) {
      skipped.push(line);
      continue;
    }
    const h = m[1] ? Number(m[1]) : 0;
    const startSec = h * 3600 + Number(m[2]) * 60 + Number(m[3]);
    segments.push({ startSec, title: (m[4] ?? '').trim() });
  }
  return { segments, skipped };
}
