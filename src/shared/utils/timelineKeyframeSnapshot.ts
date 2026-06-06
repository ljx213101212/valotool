import { useMatchupStore } from '@/shared/store/useMatchupStore';
import { useMapSelectionStore } from '@/shared/store/useMapSelectionStore';
import { reconcileMapPlacements } from '@/shared/utils/reconcileMapPlacements';
import type { TimelineKeyframeSnapshot } from '@/shared/types/timelineKeyframe';

export function captureTimelineKeyframeSnapshot(): TimelineKeyframeSnapshot {
  const m = useMatchupStore.getState();
  const mapSel = useMapSelectionStore.getState();
  return {
    matchup: {
      attackAgentIds: [...m.attackAgentIds],
      defenseAgentIds: [...m.defenseAgentIds],
      dragDropTargetSide: m.dragDropTargetSide,
      mapPlacements: structuredClone(m.mapPlacements),
      abilityPlacements: structuredClone(m.abilityPlacements),
    },
    mapSelection: {
      selectedMapId: mapSel.selectedMapId,
      side: mapSel.side,
    },
    killEvents: [],
    abilityDeployEvents: [],
    damageEvents: [],
  };
}

export function applyTimelineKeyframeSnapshot(snapshot: TimelineKeyframeSnapshot): void {
  const { matchup, mapSelection } = snapshot;
  const currentState = useMatchupStore.getState();
  // Merge agent lists: preserve agents added after this snapshot was captured.
  // A snapshot should control positions and eliminated state of agents at its time,
  // but should never remove agents that exist in the current live state.
  const attackAgentIds = [...new Set([...matchup.attackAgentIds, ...currentState.attackAgentIds])];
  const defenseAgentIds = [...new Set([...matchup.defenseAgentIds, ...currentState.defenseAgentIds])];
  // Merge placements: snapshot wins for shared agents, current wins for newer agents.
  const placementById = new Map(
    currentState.mapPlacements.map((p) => [p.id, p]),
  );
  for (const p of matchup.mapPlacements) {
    placementById.set(p.id, p);
  }
  const mapPlacements = reconcileMapPlacements(
    attackAgentIds,
    defenseAgentIds,
    [...placementById.values()],
  );
  // Merge ability placements: snapshot wins for shared ids, current wins for new ones.
  // A keyframe snapshot should control the state of abilities deployed at that time,
  // but must not discard abilities placed after the snapshot was captured.
  const currentAbilityPlacements = currentState.abilityPlacements;
  const snapshotAbilityPlacements = matchup.abilityPlacements ?? [];
  const abilityById = new Map(
    currentAbilityPlacements.map((ap) => [ap.id, ap]),
  );
  for (const ap of snapshotAbilityPlacements) {
    abilityById.set(ap.id, ap);
  }
  useMatchupStore.setState({
    attackAgentIds,
    defenseAgentIds,
    mapPlacements,
    dragDropTargetSide: matchup.dragDropTargetSide,
    abilityPlacements: structuredClone([...abilityById.values()]),
    selectedPlacementId: null,
    selectedAbilityPlacementId: null,
  });
  useMapSelectionStore.setState({
    selectedMapId: mapSelection.selectedMapId,
    side: mapSelection.side,
  });
}
