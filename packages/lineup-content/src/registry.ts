import mapsJson from './generated/maps.json';
import agentsJson from './generated/agents.json';
import type { AbilitySlot } from './schema';

export interface MapEntry {
  slug: string;
  uuid: string;
  nameEn: string;
  nameZh: string;
  pinyin: string;
  pinyinInitials: string;
  aliases: string[];
  inRankedPool: boolean;
}

export interface AgentAbility {
  slot: AbilitySlot;
  nameEn: string;
  nameZh: string;
}

export interface AgentEntry {
  slug: string;
  uuid: string;
  nameEn: string;
  nameZh: string;
  pinyin: string;
  pinyinInitials: string;
  aliases: string[];
  abilities: AgentAbility[];
}

export const MAPS = mapsJson as MapEntry[];
export const AGENTS = agentsJson as AgentEntry[];

const normalize = (token: string) => token.trim().toLowerCase().replace(/[\s./·-]/g, '');

interface Indexed<T> {
  bySlug: Map<string, T>;
  byToken: Map<string, T>;
}

function buildIndex<T extends MapEntry | AgentEntry>(entries: T[]): Indexed<T> {
  const bySlug = new Map<string, T>();
  const byToken = new Map<string, T>();
  for (const entry of entries) {
    bySlug.set(entry.slug, entry);
    const tokens = [entry.slug, entry.nameEn, entry.nameZh, entry.pinyin, entry.pinyinInitials, ...entry.aliases];
    for (const t of tokens) byToken.set(normalize(t), entry);
  }
  return { bySlug, byToken };
}

const mapIndex = buildIndex(MAPS);
const agentIndex = buildIndex(AGENTS);

/** 按 slug 精确取地图 */
export const getMap = (slug: string) => mapIndex.bySlug.get(slug);
/** 按 slug 精确取英雄 */
export const getAgent = (slug: string) => agentIndex.bySlug.get(slug);

/**
 * 按任意 token 查地图：中文名 / 英文名 / slug / 拼音全拼 / 拼音首字母 / 社区别名。
 * 这是封闭词表匹配的基础层；前缀/容错模糊匹配由上层（搜索解析）实现。
 */
export const findMap = (token: string) => mapIndex.byToken.get(normalize(token));
/** 按任意 token 查英雄，规则同 findMap */
export const findAgent = (token: string) => agentIndex.byToken.get(normalize(token));
