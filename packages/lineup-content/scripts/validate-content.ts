/**
 * 内容校验 CLI：读取 data/lineups/*.json，跑 schema + 引用完整性 + 策展约束。
 * 错误退出码 1（CI/pre-commit 可直接挂），告警仅打印。
 *
 * 用法：pnpm --filter @valotool/lineup-content check
 */
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContent } from '../src/validate.ts';

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '../data/lineups');

const files: Record<string, unknown> = {};
for (const name of (await readdir(DATA_DIR)).filter((n) => n.endsWith('.json')).sort()) {
  files[name] = JSON.parse(await readFile(join(DATA_DIR, name), 'utf8'));
}

const { lineups, errors, warnings } = validateContent(files);

for (const w of warnings) console.warn(`⚠️ ${w.file} ${w.lineupId ?? ''} ${w.message}`);
for (const e of errors) console.error(`❌ ${e.file} ${e.lineupId ?? ''} ${e.message}`);

if (errors.length > 0) {
  console.error(`\n校验失败：${errors.length} 个错误`);
  process.exit(1);
}
console.log(`✅ ${Object.keys(files).length} 个文件、${lineups.length} 条点位通过校验（${warnings.length} 条告警）`);
