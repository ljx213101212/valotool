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
  const mapPlacements = reconcileMapPlacements(
    matchup.attackAgentIds,
    matchup.defenseAgentIds,
    matchup.mapPlacements
  );
  useMatchupStore.setState({
    attackAgentIds: [...matchup.attackAgentIds],
    defenseAgentIds: [...matchup.defenseAgentIds],
    mapPlacements,
    dragDropTargetSide: matchup.dragDropTargetSide,
    abilityPlacements: structuredClone(matchup.abilityPlacements ?? []),
    selectedPlacementId: null,
    selectedAbilityPlacementId: null,
  });
  useMapSelectionStore.setState({
    selectedMapId: mapSelection.selectedMapId,
    side: mapSelection.side,
  });
}
