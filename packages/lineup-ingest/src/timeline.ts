import { sourceFileSchema, type SourceVideo } from './types';
import { AGENTS, MAPS } from '@valotool/lineup-content';

export interface ParsedSegment {
  startSec: number;
  title: string;
}

export interface TimelineParse {
  segments: ParsedSegment[];
  /** 无法识别时间戳的行（原样返回，供提示） */
  skipped: string[];
}

export interface BilibiliTimelineSourceInput {
  bvid: string;
  title: string;
  creator: string;
  creatorUid?: string;
  map: string;
  agent: string;
  recordedPatch?: string;
  note?: string;
}

export interface TimelineCliArgs {
  timelinePath?: string;
  source?: BilibiliTimelineSourceInput;
  outputPath?: string;
  help?: true;
}

const SOURCE_OPTIONS: Record<string, keyof BilibiliTimelineSourceInput> = {
  '--bvid': 'bvid',
  '--title': 'title',
  '--creator': 'creator',
  '--creator-uid': 'creatorUid',
  '--map': 'map',
  '--agent': 'agent',
  '--patch': 'recordedPatch',
  '--note': 'note',
};

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

/** 把时间轴和录入元数据组装成可直接交给 ingest 的单视频 source 清单。 */
export function buildBilibiliTimelineSource(
  text: string,
  input: BilibiliTimelineSourceInput,
): SourceVideo[] {
  const metadata = {
    bvid: requiredText(input.bvid, 'bvid'),
    title: requiredText(input.title, 'title'),
    creator: requiredText(input.creator, 'creator'),
    map: requiredText(input.map, 'map'),
    agent: requiredText(input.agent, 'agent'),
  };
  if (/^BV0{10}$/.test(metadata.bvid)) {
    throw new Error('BVID 不能使用全零占位符');
  }
  if (!MAPS.some((map) => map.slug === metadata.map)) {
    throw new Error(`未知地图 slug: ${metadata.map}`);
  }
  if (!AGENTS.some((agent) => agent.slug === metadata.agent)) {
    throw new Error(`未知英雄 slug: ${metadata.agent}`);
  }
  const creatorUid = optionalText(input.creatorUid);
  const recordedPatch = optionalText(input.recordedPatch);
  const note = optionalText(input.note);
  const uidCredit = creatorUid ? `uid ${creatorUid}，` : '';

  const source = {
    id: metadata.bvid,
    platform: 'bilibili' as const,
    url: `https://www.bilibili.com/video/${metadata.bvid}`,
    title: metadata.title,
    creator: metadata.creator,
    ...(creatorUid ? { creatorUid } : {}),
    ...(recordedPatch ? { recordedPatch } : {}),
    hints: { map: metadata.map, agent: metadata.agent },
    credit: `点位演示来源：B站 @${metadata.creator}（${uidCredit}${metadata.bvid}）`,
    ...(note ? { note } : {}),
    segments: parseTimeline(text).segments,
  };
  const result = sourceFileSchema.safeParse([source]);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`无效来源元数据：${issues}`);
  }
  return result.data;
}

/** 解析 timeline 命令行参数；完整 source 输出必须显式启用 `--source`。 */
export function parseTimelineCliArgs(args: string[]): TimelineCliArgs {
  let timelinePath: string | undefined;
  let outputPath: string | undefined;
  let sourceMode = false;
  const source: Partial<BilibiliTimelineSourceInput> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') return { help: true };
    if (arg === '--source') {
      sourceMode = true;
      continue;
    }
    if (arg === '-o' || arg === '--output') {
      const value = args[++i];
      if (!value || value.startsWith('-')) throw new Error(`${arg} 需要一个文件路径`);
      outputPath = value;
      continue;
    }

    const field = SOURCE_OPTIONS[arg];
    if (field) {
      const value = args[++i];
      if (!value || value.startsWith('-')) throw new Error(`${arg} 需要一个值`);
      source[field] = value;
      continue;
    }

    if (arg.startsWith('-')) throw new Error(`未知选项: ${arg}`);
    if (timelinePath) throw new Error(`只接受一个时间轴文件，额外参数: ${arg}`);
    timelinePath = arg;
  }

  if (!sourceMode && Object.keys(source).length) {
    throw new Error('来源元数据只能与 --source 一起使用');
  }
  const base = sourceMode
    ? { timelinePath, source: source as BilibiliTimelineSourceInput }
    : { timelinePath };
  return outputPath !== undefined ? { ...base, outputPath } : base;
}

function requiredText(value: string, name: string): string {
  const text = value.trim();
  if (!text) throw new Error(`缺少必填元数据: ${name}`);
  return text;
}

function optionalText(value: string | undefined): string | undefined {
  const text = value?.trim();
  return text || undefined;
}
