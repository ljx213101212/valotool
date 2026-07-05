/**
 * 把时间轴草稿文件解析成 sources 的 segments JSON。
 * 默认读 sources/_timeline.txt（把 B站时间轴粘进去、存盘），也可传路径：
 *   pnpm --filter @valotool/lineup-ingest timeline
 *   pnpm --filter @valotool/lineup-ingest timeline 某个文件.txt
 * 输出（stdout）= segments JSON，粘进 sources/<角色>.json 的 "segments"。
 */
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTimeline } from '../src/timeline.ts';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv[2];
const file = arg ? resolve(process.cwd(), arg) : join(PKG, 'sources', '_timeline.txt');

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
process.stdout.write(JSON.stringify(segments, null, 2) + '\n');

console.error(`\n—— 读自 ${file}`);
console.error(`—— 解析出 ${segments.length} 段`);
for (let i = 1; i < segments.length; i++) {
  if (segments[i].startSec <= segments[i - 1].startSec) {
    console.error(`⚠ 时间未递增：第 ${i + 1} 段 @${segments[i].startSec}s`);
  }
}
if (skipped.length) console.error(`跳过 ${skipped.length} 行（注释/无时间戳）`);
