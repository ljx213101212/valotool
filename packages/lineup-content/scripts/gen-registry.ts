/**
 * 注册表生成脚本：从 valorant-api.com 拉取官方 en/zh-CN 元数据，
 * 用 pinyin-pro 生成拼音检索字段，合并 src/curated/aliases.ts 的人工别名与图池标记，
 * 输出 src/generated/maps.json 与 src/generated/agents.json（提交进 git，运行时不依赖网络）。
 *
 * 用法：pnpm --filter @valotool/lineup-content gen:registry
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pinyin } from 'pinyin-pro';
import { AGENT_ALIASES, MAP_ALIASES, RANKED_POOL } from '../src/curated/aliases.ts';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '../src/generated');

function toSlug(nameEn: string): string {
  return nameEn.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function pinyinFields(nameZh: string) {
  return {
    pinyin: pinyin(nameZh, { toneType: 'none', type: 'array' }).join(''),
    pinyinInitials: pinyin(nameZh, { pattern: 'first', toneType: 'none', type: 'array' }).join(''),
  };
}

interface ApiMap {
  uuid: string;
  displayName: string;
  tacticalDescription: string | null;
}

interface ApiAbility {
  slot: string;
  displayName: string;
}

interface ApiAgent {
  uuid: string;
  displayName: string;
  abilities: ApiAbility[];
}

async function fetchJson<T>(url: string): Promise<T[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return ((await res.json()) as { data: T[] }).data;
}

async function genMaps() {
  const [en, zh] = await Promise.all([
    fetchJson<ApiMap>('https://valorant-api.com/v1/maps'),
    fetchJson<ApiMap>('https://valorant-api.com/v1/maps?language=zh-CN'),
  ]);
  const zhByUuid = new Map(zh.map((m) => [m.uuid, m]));
  const maps = en
    .filter((m) => m.tacticalDescription) // 只要竞技模式地图（排除 TDM/训练场）
    .map((m) => {
      const slug = toSlug(m.displayName);
      const nameZh = zhByUuid.get(m.uuid)?.displayName ?? m.displayName;
      return {
        slug,
        uuid: m.uuid,
        nameEn: m.displayName,
        nameZh,
        ...pinyinFields(nameZh),
        aliases: MAP_ALIASES[slug] ?? [],
        inRankedPool: RANKED_POOL.includes(slug),
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
  return maps;
}

const SLOT_MAP: Record<string, 'C' | 'Q' | 'E' | 'X'> = {
  Grenade: 'C',
  Ability1: 'Q',
  Ability2: 'E',
  Ultimate: 'X',
};

async function genAgents() {
  const query = 'isPlayableCharacter=true';
  const [en, zh] = await Promise.all([
    fetchJson<ApiAgent>(`https://valorant-api.com/v1/agents?${query}`),
    fetchJson<ApiAgent>(`https://valorant-api.com/v1/agents?language=zh-CN&${query}`),
  ]);
  const zhByUuid = new Map(zh.map((a) => [a.uuid, a]));
  const agents = en
    .map((a) => {
      const slug = toSlug(a.displayName);
      const zhAgent = zhByUuid.get(a.uuid);
      const nameZh = zhAgent?.displayName ?? a.displayName;
      const zhAbilityBySlot = new Map(
        (zhAgent?.abilities ?? []).map((ab) => [ab.slot, ab.displayName]),
      );
      const abilities = a.abilities
        .filter((ab) => SLOT_MAP[ab.slot])
        .map((ab) => ({
          slot: SLOT_MAP[ab.slot],
          nameEn: ab.displayName,
          nameZh: zhAbilityBySlot.get(ab.slot) ?? ab.displayName,
        }))
        .sort((x, y) => 'CQEX'.indexOf(x.slot) - 'CQEX'.indexOf(y.slot));
      return {
        slug,
        uuid: a.uuid,
        nameEn: a.displayName,
        nameZh,
        ...pinyinFields(nameZh),
        aliases: AGENT_ALIASES[slug] ?? [],
        abilities,
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
  return agents;
}

const maps = await genMaps();
const agents = await genAgents();

// 校验 curated 数据没有写错 slug
const mapSlugs = new Set(maps.map((m) => m.slug));
const agentSlugs = new Set(agents.map((a) => a.slug));
for (const key of [...Object.keys(MAP_ALIASES), ...RANKED_POOL]) {
  if (!mapSlugs.has(key)) console.warn(`⚠️ curated 地图 slug 未命中注册表: ${key}`);
}
for (const key of Object.keys(AGENT_ALIASES)) {
  if (!agentSlugs.has(key)) console.warn(`⚠️ curated 英雄 slug 未命中注册表: ${key}`);
}

await mkdir(OUT_DIR, { recursive: true });
await writeFile(join(OUT_DIR, 'maps.json'), JSON.stringify(maps, null, 2) + '\n');
await writeFile(join(OUT_DIR, 'agents.json'), JSON.stringify(agents, null, 2) + '\n');
console.log(`✅ 生成 ${maps.length} 张地图、${agents.length} 个英雄 -> src/generated/`);
