/**
 * 把时间轴草稿文件解析成 segments JSON，或连同元数据生成可直接 ingest 的 source JSON。
 * 默认读 sources/_timeline.txt（把 B站时间轴粘进去、存盘），也可传路径：
 *   pnpm --filter @valotool/lineup-ingest timeline
 *   pnpm --filter @valotool/lineup-ingest timeline 某个文件.txt
 *   pnpm --filter @valotool/lineup-ingest timeline 某个文件.txt --source \
 *     --bvid BV... --title "标题" --creator "UP主" --map ascent --agent jett
 * 默认 stdout = segments JSON；--source stdout = 单视频 SourceVideo[] JSON。
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBilibiliTimelineSource, parseTimeline, parseTimelineCliArgs } from '../src/timeline.ts';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
let args;
try {
  args = parseTimelineCliArgs(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

if (args.help) {
  console.log('用法：timeline [时间轴文件] [--source --bvid BV... --title 标题 --creator UP主 --map 地图slug --agent 英雄slug] [--output|-o 输出文件]');
  process.exit(0);
}

const file = args.timelinePath ? resolve(process.cwd(), args.timelinePath) : join(PKG, 'sources', '_timeline.txt');

const text = await readFile(file, 'utf8').catch(() => null);
if (text === null) {
  console.error(`读不到 ${file}\n把「mm:ss 标题」时间轴粘进该文件再运行；或指定路径：pnpm ... timeline <文件>。`);
  process.exit(1);
}
if (!text.trim()) {
  console.error(`${file} 是空的——把时间轴粘进去。`);
  process.exit(1);
}

const { segments, skipped } = parseTimeline(text);
try {
  const output = args.source ? buildBilibiliTimelineSource(text, args.source) : segments;
  const json = JSON.stringify(output, null, 2) + '\n';
  if (args.outputPath) {
    await writeFile(resolve(process.cwd(), args.outputPath), json, 'utf8');
    console.error(`已写入 ${args.outputPath}`);
  } else {
    process.stdout.write(json);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

console.error(`\n—— 读自 ${file}`);
console.error(`—— 解析出 ${segments.length} 段`);
for (let i = 1; i < segments.length; i++) {
  if (segments[i].startSec <= segments[i - 1].startSec) {
    console.error(`⚠ 时间未递增：第 ${i + 1} 段 @${segments[i].startSec}s`);
  }
}
if (skipped.length) console.error(`跳过 ${skipped.length} 行（注释/无时间戳）`);
