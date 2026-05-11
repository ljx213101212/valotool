import type { MapAgentPlacement, MatchupSide } from '@/types/matchup';
import type { TacticalSide } from '@/store/useMapSelectionStore';

/** 关键帧记录的地图与阵容快照（与 matchup / map 选择持久化字段对齐） */
export type TimelineKeyframeSnapshot = {
  matchup: {
    attackAgentIds: string[];
    defenseAgentIds: string[];
    dragDropTargetSide: MatchupSide;
    mapPlacements: MapAgentPlacement[];
  };
  mapSelection: {
    selectedMapId: string;
    side: TacticalSide;
  };
};

export type TimelineKeyframeEntry = {
  /** 稳定标识，用于拖拽与详情面板 */
  id: string;
  time: number;
  snapshot: TimelineKeyframeSnapshot;
};
