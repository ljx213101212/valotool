/**
 * CDN 上传脚本：将 images/ 目录同步到腾讯云 COS。
 *
 * 行为等价于 coscmd upload -rs images/ /，但用 Node.js SDK 实现。
 * 凭证从环境变量 COS_SECRET_ID / COS_SECRET_KEY 读取。
 * Bucket/Region 从 CDN_BASE 自动解析。
 *
 * 用法：
 *   pnpm --filter @valotool/lineup-content upload
 *   pnpm --filter @valotool/lineup-content upload --delete
 *   pnpm --filter @valotool/lineup-content upload --skipmd5
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { opendir } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import COS from 'cos-nodejs-sdk-v5';

function loadEnv() {
  const root = dirname(fileURLToPath(import.meta.url));
  let dir = root;
  for (;;) {
    for (const name of ['.env.local', '.env']) {
      const f = join(dir, name);
      if (!existsSync(f)) continue;
      for (const line of readFileSync(f, 'utf8').split('\n')) {
        const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (!m) continue;
        const key = m[1];
        let val = m[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (process.env[key] === undefined) process.env[key] = val;
      }
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
}
loadEnv();

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMAGES_DIR = join(PKG_ROOT, 'images');

const CDN_BASE = process.env.CDN_BASE;
const SECRET_ID = process.env.COS_SECRET_ID;
const SECRET_KEY = process.env.COS_SECRET_KEY;

if (!CDN_BASE) {
  console.error('❌ 未设置 CDN_BASE 环境变量');
  process.exit(1);
}
if (!SECRET_ID || !SECRET_KEY) {
  console.error('❌ 未设置 COS_SECRET_ID / COS_SECRET_KEY 环境变量');
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const DELETE = args.has('--delete');
const SKIP_MD5 = args.has('--skipmd5');

const cdnMatch = CDN_BASE.match(/^https?:\/\/(.+)\.cos\.(.+)\.myqcloud\.com\/?$/);
if (!cdnMatch) {
  console.error(`❌ 无法从 CDN_BASE 解析 Bucket/Region: ${CDN_BASE}`);
  process.exit(1);
}
const Bucket = cdnMatch[1];
const Region = cdnMatch[2];

const cos = new COS({ SecretId: SECRET_ID, SecretKey: SECRET_KEY });

function md5OfFile(path: string): string {
  const buf = readFileSync(path);
  return createHash('md5').update(buf).digest('hex');
}

async function listLocalFiles(dir: string): Promise<string[]> {
  const result: string[] = [];
  async function walk(current: string) {
    const d = await opendir(current);
    for await (const entry of d) {
      if (entry.name.startsWith('.')) continue;
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else {
        result.push(full);
      }
    }
  }
  await walk(dir);
  return result;
}

async function listRemoteKeys(): Promise<string[]> {
  const keys: string[] = [];
  let marker: string | undefined;
  for (;;) {
    const data = await new Promise<COS.GetBucketResult>((resolve, reject) => {
      cos.getBucket({ Bucket, Region, Marker: marker, MaxKeys: 1000 }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
    for (const obj of data.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key);
    }
    if (data.IsTruncated === 'true' && data.NextMarker) {
      marker = data.NextMarker;
    } else {
      break;
    }
  }
  return keys;
}

async function main() {
  if (!existsSync(IMAGES_DIR)) {
    console.error(`❌ images/ 目录不存在: ${IMAGES_DIR}`);
    process.exit(1);
  }

  const localFiles = await listLocalFiles(IMAGES_DIR);
  if (localFiles.length === 0) {
    console.log('images/ 目录为空，无需上传');
    process.exit(0);
  }

  console.log(`Bucket: ${Bucket}\nRegion: ${Region}\nCDN:   ${CDN_BASE}\n`);
  console.log(`本地文件 ${localFiles.length} 个，开始上传...\n`);

  let uploaded = 0;
  let skipped = 0;
  const uploadedKeys = new Set<string>();

  for (const absPath of localFiles) {
    const relPath = relative(IMAGES_DIR, absPath).split(sep).join('/');
    const localSize = statSync(absPath).size;
    const localMD5 = md5OfFile(absPath);

    try {
      const head = await new Promise<COS.HeadObjectResult>((resolve, reject) => {
        cos.headObject({ Bucket, Region, Key: relPath }, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });

      const remoteSize = parseInt(head.headers?.['content-length'] ?? '0', 10);
      if (
        !SKIP_MD5 && head.ETag?.replace(/^"|"$/g, '') === localMD5
        || SKIP_MD5 && remoteSize === localSize
      ) {
        skipped++;
        uploadedKeys.add(relPath);
        process.stdout.write(`  ⏭ ${relPath}\n`);
        continue;
      }
    } catch (err: any) {
      if (err.statusCode !== 404) {
        console.error(`  ❌ 查询远程文件失败 ${relPath}: ${err.message ?? err}`);
      }
    }

    await new Promise<COS.PutObjectResult>((resolve, reject) => {
      cos.putObject(
        {
          Bucket,
          Region,
          Key: relPath,
          Body: readFileSync(absPath),
          ContentLength: localSize,
        },
        (err, data) => {
          if (err) reject(err);
          else resolve(data);
        },
      );
    });

    uploaded++;
    uploadedKeys.add(relPath);
    process.stdout.write(`  ✅ ${relPath}\n`);
  }

  let deleted = 0;
  if (DELETE) {
    console.log('\n检查需要删除的远程文件...\n');
    const remoteKeys = await listRemoteKeys();
    const toDelete = remoteKeys.filter((k) => !uploadedKeys.has(k));
    deleted = toDelete.length;
    if (toDelete.length > 0) {
      for (const key of toDelete) {
        await new Promise<void>((resolve, reject) => {
          cos.deleteObject({ Bucket, Region, Key: key }, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        process.stdout.write(`  🗑 ${key}\n`);
      }
    } else {
      console.log('  （无需删除）');
    }
  }

  console.log(`\n上传 ${uploaded} 个，跳过 ${skipped} 个${DELETE ? `，删除 ${deleted} 个` : ''}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
