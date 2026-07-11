import type { Lineup, Side } from '../schema';
import ascentSova from '../../data/lineups/ascent-sova.json';

/**
 * 全部点位内容的集中出口。新增内容文件时在此登记。
 * 内容正确性由 `pnpm check`（schema + 引用完整性）在提交前保证，此处直接断言类型。
 */
export const ALL_LINEUPS: Lineup[] = [...ascentSova] as Lineup[];

const TIER_ORDER = { 'must-learn': 0, advanced: 1, flashy: 2 } as const;

/** 某地图×英雄（可选阵营）的点位，按 必学→进阶→花活 排序 */
export function lineupsFor(map: string, agent: string, side?: Side): Lineup[] {
  return ALL_LINEUPS.filter(
    (l) => l.map === map && l.agent === agent && (side === undefined || l.side === side),
  ).sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);
}

/** 某地图下各英雄的点位数（用于英雄选择页排序与「暂无」标记） */
export function lineupCountByAgent(map: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const l of ALL_LINEUPS) {
    if (l.map !== map) continue;
    counts[l.agent] = (counts[l.agent] ?? 0) + 1;
  }
  return counts;
}

export function getLineup(id: string): Lineup | undefined {
  return ALL_LINEUPS.find((l) => l.id === id);
}
