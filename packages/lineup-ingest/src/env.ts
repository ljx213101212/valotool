import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 启动时加载环境变量文件，省去命令行逐个传。
 * - 按 `APP_ENV` 选文件（默认 `local`）：`.env.<APP_ENV>`，回退 `.env`。
 * - 从本模块所在目录**向上**查找，故 env 文件放仓库根目录也能被各包命中。
 * - **已存在的变量（shell/命令行传入）优先**，文件只补缺，不覆盖。
 * 入口脚本在最顶 `import` 本模块即可。
 */
function findEnvFile(): string | null {
  const which = process.env.APP_ENV ?? 'local';
  let dir = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    for (const name of [`.env.${which}`, '.env']) {
      const f = join(dir, name);
      if (existsSync(f)) return f;
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const file = findEnvFile();
if (file) {
  for (const line of readFileSync(file, 'utf8').split('\n')) {
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
