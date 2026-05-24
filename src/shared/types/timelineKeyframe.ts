import type { AbilityPlacement } from '@/shared/types/ability';
import type { TimelineAbilityDeployEvent } from '@/shared/types/timelineAbility';
import type { MapAgentPlacement, MatchupSide } from '@/shared/types/matchup';
import type { TacticalSide } from '@/shared/store/useMapSelectionStore';

/** 单条击杀；同一关键帧时间格内数组顺序即发生顺序（首杀等） */
export type TimelineKillEvent = {
  killerPlacementId: string;
  victimPlacementId: string;
};

/** 关键帧记录的地图与阵容快照（与 matchup / map 选择持久化字段对齐） */
export type TimelineKeyframeSnapshot = {
  matchup: {
    attackAgentIds: string[];
    defenseAgentIds: string[];
    dragDropTargetSide: MatchupSide;
    mapPlacements: MapAgentPlacement[];
    /** 与 `useMatchupStore.abilityPlacements` 对齐；缺省按空数组（旧数据兼容） */
    abilityPlacements: AbilityPlacement[];
  };
  mapSelection: {
    selectedMapId: string;
    side: TacticalSide;
  };
  /** 与 `matchup.mapPlacements` 中淘汰状态一致；缺省按空数组处理（旧数据兼容） */
  killEvents: TimelineKillEvent[];
  /** 本刻度发生的技能施放/结束；缺省按空数组（旧数据兼容） */
  abilityDeployEvents: TimelineAbilityDeployEvent[];
};

export type TimelineKeyframeEntry = {
  /** 稳定标识，用于拖拽与详情面板 */
  id: string;
  time: number;
  snapshot: TimelineKeyframeSnapshot;
};
