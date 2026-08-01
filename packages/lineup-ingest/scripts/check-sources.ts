import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceFileSchema } from '../src/types';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(PKG, 'sources');

async function* walk(dir: string): AsyncGenerator<string> {
  for await (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      yield full;
    }
  }
}

const files: string[] = [];
for await (const f of walk(DIR)) files.push(f);
let totalSegs = 0;
let badFiles = 0;

for (const f of files) {
  const display = relative(DIR, f);
  const raw = JSON.parse(await readFile(f, 'utf8'));
  const r = sourceFileSchema.safeParse(raw);
  if (!r.success) {
    badFiles++;
    console.error(`❌ ${display}`);
    for (const issue of r.error.issues) {
      console.error(`   ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
    continue;
  }
  const segs = r.data.reduce((n, v) => n + (v.segments?.length ?? 0), 0);
  totalSegs += segs;
  const maps = [...new Set(r.data.map((v) => v.hints?.map ?? '?'))].join('/');
  console.log(`✅ ${display}  videos=${r.data.length}  segments=${segs}  maps=${maps}`);
}

console.log(`—— ${files.length} 个文件, 合计 ${totalSegs} 段${badFiles ? `, ${badFiles} 个文件有误` : ''}`);
if (badFiles) process.exit(1);
