import type { AbilityPlacement } from '@/shared/types/ability';
import type { TimelineAbilityDeployEvent } from '@/shared/types/timelineAbility';
import type { TimelineKeyframeSnapshot } from '@/shared/types/timelineKeyframe';

const PLAYHEAD_EPS = 1e-6;

export function buildAbilityDeployEvent(
  placement: AbilityPlacement,
  phase: TimelineAbilityDeployEvent['phase'],
): TimelineAbilityDeployEvent {
  return {
    abilityPlacementId: placement.id,
    ownerPlacementId: placement.ownerPlacementId,
    agentId: placement.agentId,
    abilitySlot: placement.abilitySlot,
    phase,
  };
}

export function patchPlacementForDeployPhase(
  placement: AbilityPlacement,
  phase: TimelineAbilityDeployEvent['phase'],
  activeAt: number,
  expiresAt: number,
): AbilityPlacement {
  if (phase === 'start') {
    return { ...placement, state: 'active', activeAt, expiresAt };
  }
  return { ...placement, state: 'expired', activeAt, expiresAt };
}

export function upsertPlacementInList(
  placements: AbilityPlacement[],
  placement: AbilityPlacement,
): AbilityPlacement[] {
  const idx = placements.findIndex((p) => p.id === placement.id);
  if (idx < 0) return [...placements, placement];
  const next = [...placements];
  next[idx] = placement;
  return next;
}

export function applyDeployEventToSnapshotPlacements(
  placements: AbilityPlacement[],
  event: TimelineAbilityDeployEvent,
  keyframeTime: number,
): AbilityPlacement[] {
  const existing = placements.find((p) => p.id === event.abilityPlacementId);
  if (!existing) return placements;
  const activeAt = existing.activeAt ?? keyframeTime;
  const expiresAt = existing.expiresAt ?? keyframeTime;
  const patched = patchPlacementForDeployPhase(existing, event.phase, activeAt, expiresAt);
  return upsertPlacementInList(placements, patched);
}

export function snapshotWithAbilityDeployAppended(
  snapshot: TimelineKeyframeSnapshot,
  event: TimelineAbilityDeployEvent,
  keyframeTime: number,
): TimelineKeyframeSnapshot {
  const prevEvents = snapshot.abilityDeployEvents ?? [];
  const prevPlacements = snapshot.matchup.abilityPlacements ?? [];
  return {
    ...snapshot,
    abilityDeployEvents: [...prevEvents, event],
    matchup: {
      ...snapshot.matchup,
      abilityPlacements: applyDeployEventToSnapshotPlacements(prevPlacements, event, keyframeTime),
    },
  };
}

/** 已施放烟雾（球型 / 线型）在当前播放头是否应显示 */
export function isDeployedSmokeVisibleAtPlayhead(
  placement: AbilityPlacement,
  playheadSec: number,
): boolean {
  if (placement.state === 'expired') return false;
  if (placement.activeAt != null && playheadSec < placement.activeAt - PLAYHEAD_EPS) return false;
  if (placement.expiresAt != null && playheadSec >= placement.expiresAt - PLAYHEAD_EPS) return false;
  return placement.state === 'active';
}

/** @deprecated 使用 isDeployedSmokeVisibleAtPlayhead */
export const isSphericalSmokeVisibleAtPlayhead = isDeployedSmokeVisibleAtPlayhead;

/** 根据播放头与 activeAt/expiresAt 推导应展示的状态（用于关键帧之间 scrub） */
export function resolveAbilityStateAtPlayhead(
  placement: AbilityPlacement,
  playheadSec: number,
): AbilityPlacement['state'] {
  if (placement.activeAt == null || placement.expiresAt == null) {
    return placement.state;
  }
  if (playheadSec < placement.activeAt - PLAYHEAD_EPS) return 'initial';
  if (playheadSec >= placement.expiresAt - PLAYHEAD_EPS) return 'expired';
  return 'active';
}

export function syncAbilityPlacementsForPlayhead(
  placements: AbilityPlacement[],
  playheadSec: number,
): AbilityPlacement[] {
  return placements.map((p) => {
    if (p.activeAt == null || p.expiresAt == null) return p;
    const state = resolveAbilityStateAtPlayhead(p, playheadSec);
    if (state === p.state) return p;
    return { ...p, state };
  });
}

export function removeAbilityDeployEventsForPlacement(
  events: TimelineAbilityDeployEvent[],
  abilityPlacementId: string,
): TimelineAbilityDeployEvent[] {
  return events.filter((e) => e.abilityPlacementId !== abilityPlacementId);
}

export function removePlacementFromSnapshot(
  snapshot: TimelineKeyframeSnapshot,
  abilityPlacementId: string,
): TimelineKeyframeSnapshot {
  return {
    ...snapshot,
    abilityDeployEvents: removeAbilityDeployEventsForPlacement(
      snapshot.abilityDeployEvents ?? [],
      abilityPlacementId,
    ),
    matchup: {
      ...snapshot.matchup,
      abilityPlacements: (snapshot.matchup.abilityPlacements ?? []).filter(
        (p) => p.id !== abilityPlacementId,
      ),
    },
  };
}
