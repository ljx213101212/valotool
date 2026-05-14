import type { MapAgentPlacement } from '@/shared/types/matchup';
import type { TimelineKeyframeEntry } from '@/shared/types/timelineKeyframe';

export type AgentKillFeedRole = 'dealt' | 'received';

/** 单条与当前特工相关的击杀履历（来自某一关键帧快照） */
export type AgentKillFeedEntry = {
  keyframeId: string;
  keyframeTime: number;
  indexInKeyframe: number;
  role: AgentKillFeedRole;
  killer: MapAgentPlacement;
  victim: MapAgentPlacement;
};

/** 与当前选中干员是否为同一人（placement id 或 阵营+特工 id） */
export function placementMatchesAgent(
  p: MapAgentPlacement,
  agent: Pick<MapAgentPlacement, 'id' | 'side' | 'agentId'>
): boolean {
  return p.id === agent.id || (p.side === agent.side && p.agentId === agent.agentId);
}

/**
 * 遍历所有关键帧的 killEvents，收集当前干员作为击杀者或受害者的条目，按时间再按帧内顺序排序。
 */
export function collectAgentKillFeed(
  agent: Pick<MapAgentPlacement, 'id' | 'side' | 'agentId'>,
  keyframes: TimelineKeyframeEntry[]
): AgentKillFeedEntry[] {
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  const out: AgentKillFeedEntry[] = [];

  for (const kf of sorted) {
    const events = kf.snapshot.killEvents ?? [];
    const placements = kf.snapshot.matchup.mapPlacements;
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      const killer = placements.find((p) => p.id === ev.killerPlacementId);
      const victim = placements.find((p) => p.id === ev.victimPlacementId);
      if (!killer || !victim) continue;

      if (placementMatchesAgent(killer, agent)) {
        out.push({
          keyframeId: kf.id,
          keyframeTime: kf.time,
          indexInKeyframe: i,
          role: 'dealt',
          killer,
          victim,
        });
      }
      if (placementMatchesAgent(victim, agent)) {
        out.push({
          keyframeId: kf.id,
          keyframeTime: kf.time,
          indexInKeyframe: i,
          role: 'received',
          killer,
          victim,
        });
      }
    }
  }

  out.sort((a, b) => {
    if (a.keyframeTime !== b.keyframeTime) return a.keyframeTime - b.keyframeTime;
    if (a.indexInKeyframe !== b.indexInKeyframe) return a.indexInKeyframe - b.indexInKeyframe;
    if (a.role !== b.role) return a.role === 'dealt' ? -1 : 1;
    return 0;
  });

  return out;
}
