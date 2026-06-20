import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { sourceFileSchema } from './types';
import { runSource } from './pipeline';
import { MockExtractor } from './extractors/mock';

// 用法: tsx src/cli.ts run <sources/xxx.json> [bvid]   ← bvid 只跑指定一条
const [cmd, file, only] = process.argv.slice(2);

async function loadSources(path: string) {
  const raw = JSON.parse(await readFile(path, 'utf8'));
  return sourceFileSchema.parse(raw);
}

if (cmd === 'run') {
  if (!file) throw new Error('用法: tsx src/cli.ts run <sources/xxx.json> [bvid]');
  const sources = (await loadSources(file)).filter((s) => !only || s.id === only);
  if (!sources.length) throw new Error(`无匹配的源${only ? `（bvid=${only}）` : ''}`);

  const extractor = new MockExtractor();
  for (const src of sources) {
    const ctx = {
      workDir: join('.work', src.id),
      extractor,
      log: (m: string) => console.log('[ingest]', m),
    };
    const drafts = await runSource(src, ctx, join('staging', `${src.id}.json`));
    const cand = drafts.reduce((n, d) => n + d.candidates.length, 0);
    console.log(`  ✅ ${src.id}: ${drafts.length} drafts, ${cand} 候选帧 + ${drafts.length} 接触表 -> staging/${src.id}.json`);
  }
} else {
  console.log('用法: tsx src/cli.ts run <sources/xxx.json> [bvid]');
}
