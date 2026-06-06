import type { DamageEvent } from '@/shared/types/damage';
import type { MapAgentPlacement } from '@/shared/types/matchup';
import type { TimelineKeyframeSnapshot } from '@/shared/types/timelineKeyframe';
import { applyDamageToCombatState, createDefaultCombatState } from './damageCombat';

function baseCombatStateForPlacement(placement: MapAgentPlacement) {
  return placement.initialCombatState ?? placement.combatState ?? createDefaultCombatState('none');
}

function combatStateAfterDamageEvents(
  placement: MapAgentPlacement,
  events: DamageEvent[],
): NonNullable<MapAgentPlacement['combatState']> {
  const relevant = events
    .filter((event) => event.targetPlacementId === placement.id)
    .sort((a, b) => a.time - b.time);
  return relevant.reduce(
    (state, event) => applyDamageToCombatState(state, event),
    baseCombatStateForPlacement(placement),
  );
}

function applyDamageEventsToPlacement(
  placement: MapAgentPlacement,
  events: DamageEvent[],
  eliminatedByVictimId: Map<string, string>,
): MapAgentPlacement {
  const combatState = combatStateAfterDamageEvents(placement, events);
  const killerPlacementId = eliminatedByVictimId.get(placement.id);
  const eliminated = combatState.eliminated || !!killerPlacementId;
  return {
    ...placement,
    combatState,
    eliminated,
    eliminatedByPlacementId: eliminated
      ? killerPlacementId ?? placement.eliminatedByPlacementId
      : undefined,
  };
}

function recomputeSnapshotCombatStates(
  snapshot: TimelineKeyframeSnapshot,
  damageEvents: DamageEvent[],
): TimelineKeyframeSnapshot {
  const killEvents = (snapshot.killEvents ?? []).filter((event) => event.source?.type !== 'damage');
  const killedVictims = new Set(killEvents.map((event) => event.victimPlacementId));
  const stateByTargetId = new Map<string, ReturnType<typeof baseCombatStateForPlacement>>();
  for (const event of [...damageEvents].sort((a, b) => a.time - b.time)) {
    const placement = snapshot.matchup.mapPlacements.find((p) => p.id === event.targetPlacementId);
    if (!placement) continue;
    const stateBeforeEvent =
      stateByTargetId.get(event.targetPlacementId) ?? baseCombatStateForPlacement(placement);
    const stateAfterEvent = applyDamageToCombatState(stateBeforeEvent, event);
    stateByTargetId.set(event.targetPlacementId, stateAfterEvent);
    if (event.source.type !== 'ability') continue;
    if (killedVictims.has(event.targetPlacementId)) continue;
    if (stateBeforeEvent?.eliminated) continue;
    if (!stateAfterEvent.eliminated) continue;
    killEvents.push({
      killerPlacementId: event.source.casterPlacementId,
      victimPlacementId: event.targetPlacementId,
      source: {
        type: 'damage',
        damageEventId: event.id,
        deploymentId: event.source.deploymentId,
      },
    });
    killedVictims.add(event.targetPlacementId);
  }
  const eliminatedByVictimId = new Map(
    killEvents.map((event) => [event.victimPlacementId, event.killerPlacementId]),
  );
  return {
    ...snapshot,
    killEvents,
    damageEvents,
    matchup: {
      ...snapshot.matchup,
      mapPlacements: snapshot.matchup.mapPlacements.map((placement) =>
        applyDamageEventsToPlacement(placement, damageEvents, eliminatedByVictimId),
      ),
    },
  };
}

export function snapshotWithDamageEventAppended(
  snapshot: TimelineKeyframeSnapshot,
  event: DamageEvent,
): TimelineKeyframeSnapshot {
  const damageEvents = [...(snapshot.damageEvents ?? []), event];
  return recomputeSnapshotCombatStates(snapshot, damageEvents);
}

export function removeDamageEventsForAbilityDeployment(
  events: DamageEvent[],
  deploymentId: string,
): DamageEvent[] {
  return events.filter(
    (event) => event.source.type !== 'ability' || event.source.deploymentId !== deploymentId,
  );
}

export function removeDamageEventsForAbilityDeploymentFromSnapshot(
  snapshot: TimelineKeyframeSnapshot,
  deploymentId: string,
): TimelineKeyframeSnapshot {
  return recomputeSnapshotCombatStates(
    snapshot,
    removeDamageEventsForAbilityDeployment(snapshot.damageEvents ?? [], deploymentId),
  );
}

export function recomputeSnapshotDamageState(
  snapshot: TimelineKeyframeSnapshot,
): TimelineKeyframeSnapshot {
  return recomputeSnapshotCombatStates(snapshot, snapshot.damageEvents ?? []);
}
