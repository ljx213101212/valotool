import type { Chapter } from '../types';

const MIN_SEC = 5;
const MAX_SEC = 90;
/** 两条 cue 间距超过此值即断为新段 */
const GAP_SEC = 15;

interface SubCue {
  startSec: number;
  endSec: number;
  text: string;
}

/** 解析 VTT/SRT 时间戳行 "00:01:23.456 --> 00:02:34.567" */
function parseTimestampRow(line: string): { startSec: number; endSec: number } | null {
  const m = line.match(/(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})/);
  if (!m) return null;
  const [, h1, m1, s1, , h2, m2, s2] = m;
  return {
    startSec: Number(h1) * 3600 + Number(m1) * 60 + Number(s1),
    endSec: Number(h2) * 3600 + Number(m2) * 60 + Number(s2),
  };
}

function parseCues(raw: string): SubCue[] {
  const cues: SubCue[] = [];
  const lines = raw.split('\n');
  let i = 0;
  while (i < lines.length) {
    const ts = parseTimestampRow(lines[i]);
    if (ts) {
      let text = '';
      i++;
      while (i < lines.length && lines[i].trim() !== '' && !parseTimestampRow(lines[i])) {
        const t = lines[i].trim();
        if (t) text += t;
        i++;
      }
      if (text) cues.push({ ...ts, text });
    } else {
      i++;
    }
  }
  return cues;
}

/**
 * 从 VTT/SRT 字幕文本提取章节。
 * 策略：相邻 cue 间距 ≤ GAP_SEC → 合并为一段；间距 > GAP_SEC → 新段。
 * 每段标题取首 cue 文本，时长受限 MIN/MAX_SEC。
 */
export function parseChaptersFromSubtitleText(raw: string, durationSec: number): Chapter[] {
  const cues = parseCues(raw);
  if (!cues.length) return [];

  const chapters: Chapter[] = [];
  let segStart = cues[0].startSec;
  let segEnd = cues[0].endSec;
  let segText = cues[0].text;

  for (let i = 1; i < cues.length; i++) {
    const gap = cues[i].startSec - segEnd;
    const span = cues[i].endSec - segStart;

    if (gap <= GAP_SEC && span <= MAX_SEC) {
      segEnd = cues[i].endSec;
    } else {
      const dur = Math.max(MIN_SEC, Math.min(MAX_SEC, segEnd - segStart));
      chapters.push({
        index: chapters.length,
        startSec: segStart,
        endSec: segStart + dur,
        title: segText,
      });
      segStart = cues[i].startSec;
      segEnd = cues[i].endSec;
      segText = cues[i].text;
    }
  }

  const lastDur = Math.max(MIN_SEC, Math.min(MAX_SEC, Math.min(segEnd, durationSec) - segStart));
  chapters.push({
    index: chapters.length,
    startSec: segStart,
    endSec: Math.min(segStart + lastDur, durationSec),
    title: segText,
  });

  return chapters;
}
