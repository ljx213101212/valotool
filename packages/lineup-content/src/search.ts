import { AGENTS, MAPS } from './registry';
import type { Side, Site } from './schema';

/**
 * 结构化组合搜索：把「亚海猎枭防B」「yhxc sova 防守」类输入按封闭词表
 * 分段贪婪匹配为筛选条件。无法识别的片段收进 unmatched，不整体失败。
 */
export interface ParsedQuery {
  map?: string;
  agent?: string;
  side?: Side;
  site?: Site;
  unmatched: string[];
}

type Kind = 'map' | 'agent' | 'side' | 'site';

interface DictEntry {
  kind: Kind;
  value: string;
  /** 同长度 token 冲突时的优先级（小者优先）：官方名 0，别名 1 */
  precedence: number;
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/[\s./·-]/g, '');

const SIDE_TOKENS: Record<string, Side> = {
  进攻: 'attack', 攻: 'attack', attack: 'attack', atk: 'attack',
  防守: 'defense', 防: 'defense', 守: 'defense', defense: 'defense', def: 'defense',
};

const SITE_TOKENS: Record<string, Site> = {
  a点: 'A', b点: 'B', c点: 'C', a: 'A', b: 'B', c: 'C',
  中路: 'mid', 中: 'mid', mid: 'mid',
};

function buildDict(): Map<string, DictEntry[]> {
  const dict = new Map<string, DictEntry[]>();
  const add = (token: string, entry: DictEntry) => {
    const key = normalize(token);
    if (!key) return;
    dict.set(key, [...(dict.get(key) ?? []), entry].sort((a, b) => a.precedence - b.precedence));
  };
  for (const m of MAPS) {
    for (const t of [m.nameZh, m.nameEn, m.slug, m.pinyin, m.pinyinInitials]) {
      add(t, { kind: 'map', value: m.slug, precedence: 0 });
    }
    for (const t of m.aliases) add(t, { kind: 'map', value: m.slug, precedence: 1 });
  }
  for (const a of AGENTS) {
    for (const t of [a.nameZh, a.nameEn, a.slug, a.pinyin, a.pinyinInitials]) {
      add(t, { kind: 'agent', value: a.slug, precedence: 0 });
    }
    for (const t of a.aliases) add(t, { kind: 'agent', value: a.slug, precedence: 1 });
  }
  for (const [t, v] of Object.entries(SIDE_TOKENS)) add(t, { kind: 'side', value: v, precedence: 0 });
  for (const [t, v] of Object.entries(SITE_TOKENS)) add(t, { kind: 'site', value: v, precedence: 0 });
  return dict;
}

let dict: Map<string, DictEntry[]> | null = null;
let maxTokenLen = 0;

export function parseQuery(input: string): ParsedQuery {
  if (!dict) {
    dict = buildDict();
    maxTokenLen = Math.max(...[...dict.keys()].map((k) => k.length));
  }
  const result: ParsedQuery = { unmatched: [] };
  let buf = '';
  const flush = () => {
    if (buf) result.unmatched.push(buf);
    buf = '';
  };

  // 先按空白分段（保护拼音词边界），段内做贪婪最长匹配
  for (const segment of input.trim().split(/\s+/).map(normalize).filter(Boolean)) {
    let i = 0;
    while (i < segment.length) {
      let hit: { entry: DictEntry; len: number } | null = null;
      for (let len = Math.min(maxTokenLen, segment.length - i); len >= 1; len--) {
        const entries = dict.get(segment.slice(i, i + len));
        if (!entries) continue;
        // 取第一个尚未填充的槽位；全被占则仍消费该 token（避免进入 unmatched）
        const entry = entries.find((e) => result[e.kind] === undefined) ?? entries[0];
        hit = { entry, len };
        break;
      }
      if (hit) {
        flush();
        const { kind, value } = hit.entry;
        if (result[kind] === undefined) {
          (result as Record<Kind, string>)[kind] = value;
        }
        i += hit.len;
      } else {
        buf += segment[i];
        i += 1;
      }
    }
    flush();
  }
  return result;
}
