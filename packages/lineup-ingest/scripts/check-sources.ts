import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceFileSchema } from '../src/types';

const PKG = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(PKG, 'sources');

const files = (await readdir(DIR)).filter((f) => f.endsWith('.json'));
let totalSegs = 0;
let badFiles = 0;

for (const f of files) {
  const raw = JSON.parse(await readFile(join(DIR, f), 'utf8'));
  const r = sourceFileSchema.safeParse(raw);
  if (!r.success) {
    badFiles++;
    console.error(`❌ ${f}`);
    for (const issue of r.error.issues) {
      console.error(`   ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
    continue;
  }
  const segs = r.data.reduce((n, v) => n + (v.segments?.length ?? 0), 0);
  totalSegs += segs;
  const maps = [...new Set(r.data.map((v) => v.hints?.map ?? '?'))].join('/');
  console.log(`✅ ${f}  videos=${r.data.length}  segments=${segs}  maps=${maps}`);
}

console.log(`—— ${files.length} 个文件, 合计 ${totalSegs} 段${badFiles ? `, ${badFiles} 个文件有误` : ''}`);
if (badFiles) process.exit(1);
