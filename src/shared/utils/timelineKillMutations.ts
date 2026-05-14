import type { MapAgentPlacement } from '@/shared/types/matchup';
import type { TimelineKillEvent, TimelineKeyframeSnapshot } from '@/shared/types/timelineKeyframe';

function revivePlacement(p: MapAgentPlacement): MapAgentPlacement {
  return { ...p, eliminated: false, eliminatedByPlacementId: undefined };
}

/** 回滚若干击杀事件对应的受害者淘汰状态（用于删除整段关键帧或撤销全部击杀） */
export function reviveVictimsFromKillEvents(
  placements: MapAgentPlacement[],
  killEvents: TimelineKillEvent[]
): MapAgentPlacement[] {
  const victimIds = new Set(killEvents.map((e) => e.victimPlacementId));
  return placements.map((p) => (victimIds.has(p.id) ? revivePlacement(p) : p));
}

/** 撤销单条击杀：仅复活该条中的受害者 */
export function reviveOneKillVictim(
  placements: MapAgentPlacement[],
  event: TimelineKillEvent
): MapAgentPlacement[] {
  return placements.map((p) => (p.id === event.victimPlacementId ? revivePlacement(p) : p));
}

/** 写入一条击杀到快照（不校验；校验由调用方完成） */
export function snapshotWithKillAppended(
  snapshot: TimelineKeyframeSnapshot,
  killerPlacementId: string,
  victimPlacementId: string
): TimelineKeyframeSnapshot {
  const killEvents = [...(snapshot.killEvents ?? []), { killerPlacementId, victimPlacementId }];
  const mapPlacements = snapshot.matchup.mapPlacements.map((p) =>
    p.id === victimPlacementId
      ? { ...p, eliminated: true, eliminatedByPlacementId: killerPlacementId }
      : p
  );
  return {
    ...snapshot,
    killEvents,
    matchup: { ...snapshot.matchup, mapPlacements },
  };
}

export function canRecordKillInPlacements(
  placements: MapAgentPlacement[],
  killerPlacementId: string,
  victimPlacementId: string
): boolean {
  const killer = placements.find((p) => p.id === killerPlacementId);
  const victim = placements.find((p) => p.id === victimPlacementId);
  if (!killer || !victim) return false;
  if (killer.id === victim.id) return false;
  if (killer.side === victim.side) return false;
  if (killer.eliminated || victim.eliminated) return false;
  return true;
}
