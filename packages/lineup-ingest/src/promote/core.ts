import { IMAGE_ROLES, lineupSchema, MUST_LEARN_CAP, type Lineup } from '@valotool/lineup-content';
import type { DraftLineup, FrameRole } from '../types';

const TIER_ORDER: Record<string, number> = { 'must-learn': 0, advanced: 1, flashy: 2 };

/**
 * 由 approved 草稿组装合法 Lineup。images url 用 CDN 模式（`${cdn}/{id}/{role}.webp`），
 * 实际 webp 由现有 ingest-images 产出。非法则抛错（promote 跳过该条）。
 */
export function buildLineup(draft: DraftLineup, cdnBase: string): Lineup {
  const id = draft.fields.id;
  const images = (IMAGE_ROLES as readonly FrameRole[])
    .filter((r) => draft.frames[r])
    .map((r) => ({ role: r, url: `${cdnBase}/${id}/${r}.webp` }));
  return lineupSchema.parse({ ...draft.fields, images });
}

/** 合并进既有数据：按 id 去重（incoming 覆盖），按 tier 排序。 */
export function mergeLineups(existing: Lineup[], incoming: Lineup[]): Lineup[] {
  const byId = new Map(existing.map((l) => [l.id, l]));
  for (const l of incoming) byId.set(l.id, l);
  return [...byId.values()].sort((a, b) => (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9));
}

/** must-learn 档每 {map,agent} 上限预检，返回超限说明（空=无超限）。 */
export function mustLearnViolations(lineups: Lineup[]): string[] {
  const counts = new Map<string, number>();
  for (const l of lineups) {
    if (l.tier !== 'must-learn') continue;
    const k = `${l.map}-${l.agent}`;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, n]) => n > MUST_LEARN_CAP)
    .map(([k, n]) => `${k}: must-learn ${n} 超过上限 ${MUST_LEARN_CAP}`);
}
