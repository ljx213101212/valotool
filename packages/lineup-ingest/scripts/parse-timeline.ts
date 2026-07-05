/**
 * 把粘贴的时间轴文本解析成 sources 的 segments JSON。
 * 用法（mac 剪贴板最顺）：
 *   pbpaste | pnpm --filter @valotool/lineup-ingest timeline
 *   pnpm --filter @valotool/lineup-ingest timeline < 时间轴.txt
 * 输出（stdout）= segments JSON，直接粘进 sources/<角色>.json 的 "segments"。
 */
import { parseTimeline } from '../src/timeline.ts';

const chunks: Buffer[] = [];
for await (const c of process.stdin) chunks.push(c as Buffer);
const text = Buffer.concat(chunks).toString('utf8');

if (!text.trim()) {
  console.error('从 stdin 读到空。用法：pbpaste | pnpm --filter @valotool/lineup-ingest timeline');
  process.exit(1);
}

const { segments, skipped } = parseTimeline(text);
process.stdout.write(JSON.stringify(segments, null, 2) + '\n');

console.error(`\n—— 解析出 ${segments.length} 段`);
for (let i = 1; i < segments.length; i++) {
  if (segments[i].startSec <= segments[i - 1].startSec) {
    console.error(`⚠ 时间未递增：第 ${i + 1} 段 @${segments[i].startSec}s`);
  }
}
if (skipped.length) {
  console.error(`跳过 ${skipped.length} 行（无时间戳）：`);
  for (const s of skipped.slice(0, 6)) console.error(`   ${s}`);
}
