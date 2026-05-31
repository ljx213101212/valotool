import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AbilitySlot } from '@/features/abilities/config';
import {
  getDrawableCurveMaxLength,
  getMovementActivationDelaySec,
  getMovementKind,
  getMovementRange,
  getSmokeDurationSec,
  isBlastPackMovementAbility,
  isDirectMovementAbility,
  isDrawableCurveSmokeAbility,
  isFixedDualLineSmokeAbility,
  isFixedSingleLineSmokeAbility,
  isSphericalSmokeAbility,
  isStaticAnchorMovementAbility,
  smokeMapUnitsFromMeters,
} from '@/features/abilities/config';
import {
  clampCurvePointsToMaxLength,
  curveSmokeAnchor,
  isValidCurveSmokePoints,
} from '@/shared/utils/curveSmokeGeometry';
import { useTimelineKeyframeStore } from '@/shared/store/timelineKeyframeStore';
import { useTimelinePlaybackStore } from '@/shared/store/timelinePlaybackStore';
import { buildAbilityDeployEvent } from '@/shared/utils/timelineAbilityMutations';
import { syncLiveAbilityPlacementsForPlayhead } from '@/shared/utils/timelineAbilityPlayheadSync';
import { quantizeTimelineSeconds } from '@/shared/utils/timelineQuantize';
import type { AbilityPlacement, AbilityPopoverAnchor } from '@/shared/types/ability';
import type { MapAgentPlacement, MatchupSide } from '@/shared/types/matchup';
import { clampPointToMovementRange } from '@/shared/utils/directMovementGeometry';
import { nextAbilitySpawnPoint } from '@/shared/utils/abilitySpawnPosition';
import { normalizeAbilityPlacements } from '@/shared/utils/normalizeAbilityPlacements';
import { reconcileMapPlacements } from '@/shared/utils/reconcileMapPlacements';
import type { MovementAnchorKind } from '@/shared/types/movement';

const BLAST_PACK_IMPACT_RADIUS = smokeMapUnitsFromMeters(6);

export type { MatchupSide, MapAgentPlacement } from '@/shared/types/matchup';

export type SpawnAbilityInput = {
  ownerPlacementId: string;
  agentId: string;
  abilitySlot: AbilitySlot;
  x: number;
  y: number;
};

interface MatchupState {
  attackAgentIds: string[];
  defenseAgentIds: string[];
  mapPlacements: MapAgentPlacement[];
  abilityPlacements: AbilityPlacement[];
  /** ⌘/Ctrl+点击特工后的部署技能 Popover（仅内存） */
  abilityPopoverPlacementId: string | null;
  abilityPopoverAnchor: AbilityPopoverAnchor | null;
  /** ⌘/Ctrl+点击地图上技能实例后的操作 Popover（仅内存） */
  abilityInstancePopoverId: string | null;
  abilityInstancePopoverAnchor: AbilityPopoverAnchor | null;
  /** 球型烟雾放置预览（仅内存） */
  sphericalSmokePlacementId: string | null;
  sphericalSmokePreview: { x: number; y: number } | null;
  /** 固定双线烟放置预览（仅内存） */
  fixedDualLineSmokePlacementId: string | null;
  fixedDualLineSmokePreview: { cx: number; cy: number; facing: number } | null;
  /** 固定单线烟放置预览（仅内存，朝向锁定施放者） */
  fixedSingleLineSmokePlacementId: string | null;
  fixedSingleLineSmokePreview: { cx: number; cy: number; facing: number } | null;
  /** 可画曲线烟（仅内存） */
  curveSmokePlacementId: string | null;
  curveSmokePreviewPoints: number[];
  /** 直接位移放置预览（仅内存） */
  directMovementPlacementId: string | null;
  directMovementPreview: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    facing: number;
  } | null;
  /** 静态锚点位移放置预览（如 Chamber Rendezvous） */
  anchorMovementPlacementDraft: {
    ownerPlacementId: string;
    agentId: string;
    abilitySlot: AbilitySlot;
    range: number;
    previewX: number;
    previewY: number;
  } | null;
  /** 炸药包放置预览（从预备期 token 激活） */
  blastPackPlacementId: string | null;
  blastPackPreview: { x: number; y: number } | null;
  /** 炸药包放置预览（从 Raze 头像技能 popover 直接触发） */
  blastPackPlacementDraft: {
    ownerPlacementId: string;
    agentId: string;
    abilitySlot: AbilitySlot;
    range: number;
    previewX: number;
    previewY: number;
  } | null;
  /** 地图上当前选中的特工 placement（仅内存，不参与 persist） */
  selectedPlacementId: string | null;
  setSelectedPlacementId: (id: string | null) => void;
  /** 地图上当前选中的技能实例（仅内存，不参与 persist） */
  selectedAbilityPlacementId: string | null;
  setSelectedAbilityPlacementId: (id: string | null) => void;
  openAbilityPopover: (placementId: string, anchor: AbilityPopoverAnchor) => void;
  closeAbilityPopover: () => void;
  openAbilityInstancePopover: (abilityId: string, anchor: AbilityPopoverAnchor) => void;
  closeAbilityInstancePopover: () => void;
  beginSphericalSmokePlacement: (abilityPlacementId: string) => void;
  updateSphericalSmokePreview: (x: number, y: number) => void;
  cancelSphericalSmokePlacement: () => void;
  confirmSphericalSmokePlacement: (x: number, y: number) => void;
  beginFixedDualLineSmokePlacement: (abilityPlacementId: string) => void;
  updateFixedDualLineSmokePreview: (cx: number, cy: number, facing: number) => void;
  cancelFixedDualLineSmokePlacement: () => void;
  confirmFixedDualLineSmokePlacement: (cx: number, cy: number, facing: number) => void;
  beginFixedSingleLineSmokePlacement: (abilityPlacementId: string) => void;
  updateFixedSingleLineSmokePreview: (cx: number, cy: number, facing: number) => void;
  cancelFixedSingleLineSmokePlacement: () => void;
  confirmFixedSingleLineSmokePlacement: (cx: number, cy: number, facing: number) => void;
  beginCurveSmokePlacement: (abilityPlacementId: string) => void;
  setCurveSmokePreviewPoints: (points: number[]) => void;
  cancelCurveSmokePlacement: () => void;
  confirmCurveSmokePlacement: (points: number[]) => void;
  beginDirectMovementPlacement: (abilityPlacementId: string) => void;
  updateDirectMovementPreview: (targetX: number, targetY: number) => void;
  cancelDirectMovementPlacement: () => void;
  confirmDirectMovementPlacement: (targetX: number, targetY: number) => void;
  beginBlastPackPlacement: (abilityPlacementId: string) => void;
  beginBlastPackPlacementFromAgent: (
    input: Omit<SpawnAbilityInput, 'x' | 'y'>
  ) => void;
  updateBlastPackPreview: (targetX: number, targetY: number) => void;
  cancelBlastPackPlacement: () => void;
  confirmBlastPackPlacement: (targetX: number, targetY: number) => void;
  beginAnchorMovementPlacement: (
    input: Omit<SpawnAbilityInput, 'x' | 'y'>
  ) => void;
  updateAnchorMovementPlacementPreview: (targetX: number, targetY: number) => void;
  cancelAnchorMovementPlacement: () => void;
  confirmAnchorMovementPlacement: (targetX: number, targetY: number) => void;
  deployAgentAbility: (input: Omit<SpawnAbilityInput, 'x' | 'y'>) => void;
  triggerArmedMovementAbility: (ownerPlacementId: string, abilitySlot: AbilitySlot) => void;
  spawnAbilityPlacement: (input: SpawnAbilityInput) => void;
  spawnAbilityAtMapCenter: (
    input: Omit<SpawnAbilityInput, 'x' | 'y'>
  ) => void;
  /** 从右侧拖入地图时加入的阵营（与左侧「场景」进攻/防守视角无关） */
  dragDropTargetSide: MatchupSide;
  setDragDropTargetSide: (side: MatchupSide) => void;
  addAgent: (side: MatchupSide, agentId: string) => void;
  removeAgent: (side: MatchupSide, agentId: string) => void;
  patchMapPlacement: (
    id: string,
    patch: Partial<
      Pick<MapAgentPlacement, 'x' | 'y' | 'facing' | 'eliminated' | 'eliminatedByPlacementId'>
    >
  ) => void;
  patchAbilityPlacement: (
    id: string,
    patch: Partial<
      Pick<
        AbilityPlacement,
        'x' | 'y' | 'state' | 'lineSmoke' | 'curveSmoke' | 'directMovement' | 'anchorMovement'
      >
    >
  ) => void;
  removeAbilityPlacement: (id: string) => void;
  /** 移除技能并归还技能点给施放者（归还逻辑待 buy-loadout 模块实现） */
  recallAbilityPlacement: (id: string) => void;
}

function pickSelectionAfterPlacements(
  prevSelected: string | null,
  mapPlacements: MapAgentPlacement[]
): string | null {
  return prevSelected && mapPlacements.some((p) => p.id === prevSelected)
    ? prevSelected
    : null;
}

function inferMovementAnchorKind(agentId: string, abilitySlot: AbilitySlot): MovementAnchorKind {
  if (isBlastPackMovementAbility(agentId, abilitySlot)) return 'blast-pack';
  if (getMovementKind(agentId, abilitySlot) === 'rewind') return 'refract';
  return 'rendezvous';
}

function findArmedMovementAbility(
  abilityPlacements: AbilityPlacement[],
  ownerPlacementId: string,
  abilitySlot: AbilitySlot,
): AbilityPlacement | undefined {
  return abilityPlacements.find(
    (p) =>
      p.ownerPlacementId === ownerPlacementId &&
      p.abilitySlot === abilitySlot &&
      p.anchorMovement?.status === 'armed'
  );
}

export const useMatchupStore = create<MatchupState>()(
  devtools(
    persist(
      (set) => ({
      attackAgentIds: [],
      defenseAgentIds: [],
      mapPlacements: [],
      abilityPlacements: [],
      abilityPopoverPlacementId: null,
      abilityPopoverAnchor: null,
      abilityInstancePopoverId: null,
      abilityInstancePopoverAnchor: null,
      sphericalSmokePlacementId: null,
      sphericalSmokePreview: null,
      fixedDualLineSmokePlacementId: null,
      fixedDualLineSmokePreview: null,
      fixedSingleLineSmokePlacementId: null,
      fixedSingleLineSmokePreview: null,
      curveSmokePlacementId: null,
      curveSmokePreviewPoints: [],
      directMovementPlacementId: null,
      directMovementPreview: null,
      anchorMovementPlacementDraft: null,
      blastPackPlacementId: null,
      blastPackPreview: null,
      blastPackPlacementDraft: null,
      selectedPlacementId: null,
      selectedAbilityPlacementId: null,
      setSelectedPlacementId: (id) =>
        set({
          selectedPlacementId: id,
          selectedAbilityPlacementId: null,
          abilityPopoverPlacementId: null,
          abilityPopoverAnchor: null,
          abilityInstancePopoverId: null,
          abilityInstancePopoverAnchor: null,
        }),
      setSelectedAbilityPlacementId: (id) =>
        set({
          selectedAbilityPlacementId: id,
          selectedPlacementId: null,
          abilityPopoverPlacementId: null,
          abilityPopoverAnchor: null,
          abilityInstancePopoverId: null,
          abilityInstancePopoverAnchor: null,
        }),
      openAbilityPopover: (placementId, anchor) =>
        set({
          abilityPopoverPlacementId: placementId,
          abilityPopoverAnchor: anchor,
          abilityInstancePopoverId: null,
          abilityInstancePopoverAnchor: null,
        }),
      closeAbilityPopover: () =>
        set({
          abilityPopoverPlacementId: null,
          abilityPopoverAnchor: null,
        }),
      openAbilityInstancePopover: (abilityId, anchor) =>
        set({
          abilityInstancePopoverId: abilityId,
          abilityInstancePopoverAnchor: anchor,
          abilityPopoverPlacementId: null,
          abilityPopoverAnchor: null,
        }),
      closeAbilityInstancePopover: () =>
        set({
          abilityInstancePopoverId: null,
          abilityInstancePopoverAnchor: null,
        }),
      beginSphericalSmokePlacement: (abilityPlacementId) =>
        set((s) => {
          const placement = s.abilityPlacements.find((p) => p.id === abilityPlacementId);
          if (
            !placement ||
            placement.state !== 'initial' ||
            !isSphericalSmokeAbility(placement.agentId, placement.abilitySlot)
          ) {
            return s;
          }
          return {
            sphericalSmokePlacementId: abilityPlacementId,
            sphericalSmokePreview: { x: placement.x, y: placement.y },
            fixedDualLineSmokePlacementId: null,
            fixedDualLineSmokePreview: null,
            fixedSingleLineSmokePlacementId: null,
            fixedSingleLineSmokePreview: null,
            curveSmokePlacementId: null,
            curveSmokePreviewPoints: [],
            directMovementPlacementId: null,
            directMovementPreview: null,
            anchorMovementPlacementDraft: null,
            blastPackPlacementId: null,
            blastPackPreview: null,
            blastPackPlacementDraft: null,
            abilityInstancePopoverId: null,
            abilityInstancePopoverAnchor: null,
            abilityPopoverPlacementId: null,
            abilityPopoverAnchor: null,
          };
        }),
      updateSphericalSmokePreview: (x, y) =>
        set((s) =>
          s.sphericalSmokePlacementId
            ? { sphericalSmokePreview: { x, y } }
            : s
        ),
      cancelSphericalSmokePlacement: () =>
        set({
          sphericalSmokePlacementId: null,
          sphericalSmokePreview: null,
        }),
      beginFixedDualLineSmokePlacement: (abilityPlacementId) =>
        set((s) => {
          const placement = s.abilityPlacements.find((p) => p.id === abilityPlacementId);
          if (
            !placement ||
            placement.state !== 'initial' ||
            !isFixedDualLineSmokeAbility(placement.agentId, placement.abilitySlot)
          ) {
            return s;
          }
          const owner = s.mapPlacements.find((p) => p.id === placement.ownerPlacementId);
          const facing = owner
            ? Math.atan2(placement.y - owner.y, placement.x - owner.x)
            : 0;
          return {
            fixedDualLineSmokePlacementId: abilityPlacementId,
            fixedDualLineSmokePreview: { cx: placement.x, cy: placement.y, facing },
            sphericalSmokePlacementId: null,
            sphericalSmokePreview: null,
            fixedSingleLineSmokePlacementId: null,
            fixedSingleLineSmokePreview: null,
            curveSmokePlacementId: null,
            curveSmokePreviewPoints: [],
            directMovementPlacementId: null,
            directMovementPreview: null,
            anchorMovementPlacementDraft: null,
            blastPackPlacementId: null,
            blastPackPreview: null,
            blastPackPlacementDraft: null,
            abilityInstancePopoverId: null,
            abilityInstancePopoverAnchor: null,
            abilityPopoverPlacementId: null,
            abilityPopoverAnchor: null,
          };
        }),
      updateFixedDualLineSmokePreview: (cx, cy, facing) =>
        set((s) =>
          s.fixedDualLineSmokePlacementId
            ? { fixedDualLineSmokePreview: { cx, cy, facing } }
            : s
        ),
      cancelFixedDualLineSmokePlacement: () =>
        set({
          fixedDualLineSmokePlacementId: null,
          fixedDualLineSmokePreview: null,
        }),
      beginFixedSingleLineSmokePlacement: (abilityPlacementId) =>
        set((s) => {
          const placement = s.abilityPlacements.find((p) => p.id === abilityPlacementId);
          if (
            !placement ||
            placement.state !== 'initial' ||
            !isFixedSingleLineSmokeAbility(placement.agentId, placement.abilitySlot)
          ) {
            return s;
          }
          const owner = s.mapPlacements.find((p) => p.id === placement.ownerPlacementId);
          const facing = owner
            ? Math.atan2(placement.y - owner.y, placement.x - owner.x)
            : 0;
          return {
            fixedSingleLineSmokePlacementId: abilityPlacementId,
            fixedSingleLineSmokePreview: { cx: placement.x, cy: placement.y, facing },
            sphericalSmokePlacementId: null,
            sphericalSmokePreview: null,
            fixedDualLineSmokePlacementId: null,
            fixedDualLineSmokePreview: null,
            curveSmokePlacementId: null,
            curveSmokePreviewPoints: [],
            directMovementPlacementId: null,
            directMovementPreview: null,
            anchorMovementPlacementDraft: null,
            blastPackPlacementId: null,
            blastPackPreview: null,
            blastPackPlacementDraft: null,
            abilityInstancePopoverId: null,
            abilityInstancePopoverAnchor: null,
            abilityPopoverPlacementId: null,
            abilityPopoverAnchor: null,
          };
        }),
      updateFixedSingleLineSmokePreview: (cx, cy, facing) =>
        set((s) =>
          s.fixedSingleLineSmokePlacementId
            ? { fixedSingleLineSmokePreview: { cx, cy, facing } }
            : s
        ),
      cancelFixedSingleLineSmokePlacement: () =>
        set({
          fixedSingleLineSmokePlacementId: null,
          fixedSingleLineSmokePreview: null,
        }),
      beginCurveSmokePlacement: (abilityPlacementId) =>
        set((s) => {
          const placement = s.abilityPlacements.find((p) => p.id === abilityPlacementId);
          if (
            !placement ||
            placement.state !== 'initial' ||
            !isDrawableCurveSmokeAbility(placement.agentId, placement.abilitySlot)
          ) {
            return s;
          }
          return {
            curveSmokePlacementId: abilityPlacementId,
            curveSmokePreviewPoints: [],
            sphericalSmokePlacementId: null,
            sphericalSmokePreview: null,
            fixedDualLineSmokePlacementId: null,
            fixedDualLineSmokePreview: null,
            fixedSingleLineSmokePlacementId: null,
            fixedSingleLineSmokePreview: null,
            directMovementPlacementId: null,
            directMovementPreview: null,
            anchorMovementPlacementDraft: null,
            blastPackPlacementId: null,
            blastPackPreview: null,
            blastPackPlacementDraft: null,
            abilityInstancePopoverId: null,
            abilityInstancePopoverAnchor: null,
            abilityPopoverPlacementId: null,
            abilityPopoverAnchor: null,
          };
        }),
      setCurveSmokePreviewPoints: (points) =>
        set((s) => (s.curveSmokePlacementId ? { curveSmokePreviewPoints: points } : s)),
      cancelCurveSmokePlacement: () =>
        set({
          curveSmokePlacementId: null,
          curveSmokePreviewPoints: [],
        }),
      confirmSphericalSmokePlacement: (x, y) => {
        const id = useMatchupStore.getState().sphericalSmokePlacementId;
        if (!id) return;
        const target = useMatchupStore.getState().abilityPlacements.find((p) => p.id === id);
        if (!target || !isSphericalSmokeAbility(target.agentId, target.abilitySlot)) {
          useMatchupStore.setState({
            sphericalSmokePlacementId: null,
            sphericalSmokePreview: null,
          });
          return;
        }
        const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
        const startT = quantizeTimelineSeconds(currentTime, maxTime);
        const duration = getSmokeDurationSec(target.agentId, target.abilitySlot);
        const endT = quantizeTimelineSeconds(Math.min(startT + duration, maxTime), maxTime);
        const updated = {
          ...target,
          x,
          y,
          state: 'active' as const,
          activeAt: startT,
          expiresAt: endT,
        };
        useMatchupStore.setState((s) => ({
          abilityPlacements: s.abilityPlacements.map((p) => (p.id === id ? updated : p)),
          sphericalSmokePlacementId: null,
          sphericalSmokePreview: null,
        }));
        const startEvent = buildAbilityDeployEvent(updated, 'start');
        const endEvent = buildAbilityDeployEvent(updated, 'end');
        useTimelineKeyframeStore.getState().recordAbilityDeployAtTime(startT, startEvent);
        useTimelineKeyframeStore.getState().recordAbilityDeployAtTime(endT, endEvent);
        syncLiveAbilityPlacementsForPlayhead(currentTime);
      },
      confirmFixedDualLineSmokePlacement: (cx, cy, facing) => {
        const id = useMatchupStore.getState().fixedDualLineSmokePlacementId;
        if (!id) return;
        const target = useMatchupStore.getState().abilityPlacements.find((p) => p.id === id);
        if (!target || !isFixedDualLineSmokeAbility(target.agentId, target.abilitySlot)) {
          useMatchupStore.setState({
            fixedDualLineSmokePlacementId: null,
            fixedDualLineSmokePreview: null,
          });
          return;
        }
        const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
        const startT = quantizeTimelineSeconds(currentTime, maxTime);
        const duration = getSmokeDurationSec(target.agentId, target.abilitySlot);
        const endT = quantizeTimelineSeconds(Math.min(startT + duration, maxTime), maxTime);
        const lineSmoke = { cx, cy, facing };
        const updated = {
          ...target,
          x: cx,
          y: cy,
          state: 'active' as const,
          activeAt: startT,
          expiresAt: endT,
          lineSmoke,
        };
        useMatchupStore.setState((s) => ({
          abilityPlacements: s.abilityPlacements.map((p) => (p.id === id ? updated : p)),
          fixedDualLineSmokePlacementId: null,
          fixedDualLineSmokePreview: null,
        }));
        const startEvent = buildAbilityDeployEvent(updated, 'start');
        const endEvent = buildAbilityDeployEvent(updated, 'end');
        useTimelineKeyframeStore.getState().recordAbilityDeployAtTime(startT, startEvent);
        useTimelineKeyframeStore.getState().recordAbilityDeployAtTime(endT, endEvent);
        syncLiveAbilityPlacementsForPlayhead(currentTime);
      },
      confirmFixedSingleLineSmokePlacement: (cx, cy, facing) => {
        const id = useMatchupStore.getState().fixedSingleLineSmokePlacementId;
        if (!id) return;
        const target = useMatchupStore.getState().abilityPlacements.find((p) => p.id === id);
        if (!target || !isFixedSingleLineSmokeAbility(target.agentId, target.abilitySlot)) {
          useMatchupStore.setState({
            fixedSingleLineSmokePlacementId: null,
            fixedSingleLineSmokePreview: null,
          });
          return;
        }
        const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
        const startT = quantizeTimelineSeconds(currentTime, maxTime);
        const duration = getSmokeDurationSec(target.agentId, target.abilitySlot);
        const endT = quantizeTimelineSeconds(Math.min(startT + duration, maxTime), maxTime);
        const lineSmoke = { cx, cy, facing };
        const updated = {
          ...target,
          x: cx,
          y: cy,
          state: 'active' as const,
          activeAt: startT,
          expiresAt: endT,
          lineSmoke,
        };
        useMatchupStore.setState((s) => ({
          abilityPlacements: s.abilityPlacements.map((p) => (p.id === id ? updated : p)),
          fixedSingleLineSmokePlacementId: null,
          fixedSingleLineSmokePreview: null,
        }));
        const startEvent = buildAbilityDeployEvent(updated, 'start');
        const endEvent = buildAbilityDeployEvent(updated, 'end');
        useTimelineKeyframeStore.getState().recordAbilityDeployAtTime(startT, startEvent);
        useTimelineKeyframeStore.getState().recordAbilityDeployAtTime(endT, endEvent);
        syncLiveAbilityPlacementsForPlayhead(currentTime);
      },
      confirmCurveSmokePlacement: (points) => {
        const id = useMatchupStore.getState().curveSmokePlacementId;
        if (!id || !isValidCurveSmokePoints(points)) return;
        const target = useMatchupStore.getState().abilityPlacements.find((p) => p.id === id);
        if (!target || !isDrawableCurveSmokeAbility(target.agentId, target.abilitySlot)) {
          useMatchupStore.setState({
            curveSmokePlacementId: null,
            curveSmokePreviewPoints: [],
          });
          return;
        }
        const maxLen = getDrawableCurveMaxLength(target.agentId, target.abilitySlot);
        const clamped = clampCurvePointsToMaxLength(points, maxLen);
        if (!isValidCurveSmokePoints(clamped)) return;
        const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
        const startT = quantizeTimelineSeconds(currentTime, maxTime);
        const duration = getSmokeDurationSec(target.agentId, target.abilitySlot);
        const endT = quantizeTimelineSeconds(Math.min(startT + duration, maxTime), maxTime);
        const anchor = curveSmokeAnchor(clamped);
        const updated = {
          ...target,
          x: anchor.x,
          y: anchor.y,
          state: 'active' as const,
          activeAt: startT,
          expiresAt: endT,
          curveSmoke: { points: [...clamped] },
        };
        useMatchupStore.setState((s) => ({
          abilityPlacements: s.abilityPlacements.map((p) => (p.id === id ? updated : p)),
          curveSmokePlacementId: null,
          curveSmokePreviewPoints: [],
        }));
        const startEvent = buildAbilityDeployEvent(updated, 'start');
        const endEvent = buildAbilityDeployEvent(updated, 'end');
        useTimelineKeyframeStore.getState().recordAbilityDeployAtTime(startT, startEvent);
        useTimelineKeyframeStore.getState().recordAbilityDeployAtTime(endT, endEvent);
        syncLiveAbilityPlacementsForPlayhead(currentTime);
      },
      beginDirectMovementPlacement: (abilityPlacementId) =>
        set((s) => {
          const placement = s.abilityPlacements.find((p) => p.id === abilityPlacementId);
          const owner = placement
            ? s.mapPlacements.find((p) => p.id === placement.ownerPlacementId)
            : undefined;
          if (
            !placement ||
            !owner ||
            owner.eliminated ||
            placement.state !== 'initial' ||
            !isDirectMovementAbility(placement.agentId, placement.abilitySlot)
          ) {
            return s;
          }
          const range = getMovementRange(placement.agentId, placement.abilitySlot);
          const target = clampPointToMovementRange(owner.x, owner.y, placement.x, placement.y, range);
          return {
            directMovementPlacementId: abilityPlacementId,
            directMovementPreview: {
              startX: owner.x,
              startY: owner.y,
              endX: target.x,
              endY: target.y,
              facing: target.facing,
            },
            sphericalSmokePlacementId: null,
            sphericalSmokePreview: null,
            fixedDualLineSmokePlacementId: null,
            fixedDualLineSmokePreview: null,
            fixedSingleLineSmokePlacementId: null,
            fixedSingleLineSmokePreview: null,
            curveSmokePlacementId: null,
            curveSmokePreviewPoints: [],
            anchorMovementPlacementDraft: null,
            blastPackPlacementId: null,
            blastPackPreview: null,
            blastPackPlacementDraft: null,
            abilityInstancePopoverId: null,
            abilityInstancePopoverAnchor: null,
            abilityPopoverPlacementId: null,
            abilityPopoverAnchor: null,
          };
        }),
      updateDirectMovementPreview: (targetX, targetY) =>
        set((s) => {
          if (!s.directMovementPlacementId || !s.directMovementPreview) return s;
          const placement = s.abilityPlacements.find((p) => p.id === s.directMovementPlacementId);
          if (!placement) return s;
          const range = getMovementRange(placement.agentId, placement.abilitySlot);
          const target = clampPointToMovementRange(
            s.directMovementPreview.startX,
            s.directMovementPreview.startY,
            targetX,
            targetY,
            range,
          );
          return {
            directMovementPreview: {
              ...s.directMovementPreview,
              endX: target.x,
              endY: target.y,
              facing: target.facing,
            },
          };
        }),
      cancelDirectMovementPlacement: () =>
        set({
          directMovementPlacementId: null,
          directMovementPreview: null,
        }),
      confirmDirectMovementPlacement: (targetX, targetY) => {
        const { directMovementPlacementId, directMovementPreview } = useMatchupStore.getState();
        if (!directMovementPlacementId || !directMovementPreview) return;
        const state = useMatchupStore.getState();
        const target = state.abilityPlacements.find((p) => p.id === directMovementPlacementId);
        const owner = target
          ? state.mapPlacements.find((p) => p.id === target.ownerPlacementId)
          : undefined;
        if (
          !target ||
          !owner ||
          owner.eliminated ||
          !isDirectMovementAbility(target.agentId, target.abilitySlot)
        ) {
          useMatchupStore.setState({
            directMovementPlacementId: null,
            directMovementPreview: null,
          });
          return;
        }
        const range = getMovementRange(target.agentId, target.abilitySlot);
        const end = clampPointToMovementRange(
          directMovementPreview.startX,
          directMovementPreview.startY,
          targetX,
          targetY,
          range,
        );
        const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
        const deployT = quantizeTimelineSeconds(currentTime, maxTime);
        const activationDelaySec = getMovementActivationDelaySec(target.agentId, target.abilitySlot);
        const directMovement = {
          startX: directMovementPreview.startX,
          startY: directMovementPreview.startY,
          endX: end.x,
          endY: end.y,
          facing: end.facing,
          ...(activationDelaySec > 0 ? { activationDelaySec } : {}),
        };
        const updatedAbility = {
          ...target,
          x: end.x,
          y: end.y,
          state: 'active' as const,
          activeAt: deployT,
          directMovement,
        };
        useMatchupStore.setState((s) => ({
          mapPlacements: s.mapPlacements.map((p) =>
            p.id === owner.id ? { ...p, x: end.x, y: end.y, facing: end.facing } : p
          ),
          abilityPlacements: s.abilityPlacements.map((p) =>
            p.id === directMovementPlacementId ? updatedAbility : p
          ),
          directMovementPlacementId: null,
          directMovementPreview: null,
          selectedPlacementId: owner.id,
          selectedAbilityPlacementId: null,
        }));
        const event = buildAbilityDeployEvent(updatedAbility, 'instant');
        useTimelineKeyframeStore.getState().recordAbilityDeployAtTime(deployT, event);
        syncLiveAbilityPlacementsForPlayhead(currentTime);
      },
      beginBlastPackPlacement: (abilityPlacementId) =>
        set((s) => {
          const placement = s.abilityPlacements.find((p) => p.id === abilityPlacementId);
          const owner = placement
            ? s.mapPlacements.find((p) => p.id === placement.ownerPlacementId)
            : undefined;
          if (
            !placement ||
            !owner ||
            owner.eliminated ||
            placement.state !== 'initial' ||
            !isBlastPackMovementAbility(placement.agentId, placement.abilitySlot)
          ) {
            return s;
          }
          const range = getMovementRange(placement.agentId, placement.abilitySlot);
          const target = clampPointToMovementRange(owner.x, owner.y, placement.x, placement.y, range);
          return {
            blastPackPlacementId: abilityPlacementId,
            blastPackPreview: { x: target.x, y: target.y },
            sphericalSmokePlacementId: null,
            sphericalSmokePreview: null,
            fixedDualLineSmokePlacementId: null,
            fixedDualLineSmokePreview: null,
            fixedSingleLineSmokePlacementId: null,
            fixedSingleLineSmokePreview: null,
            curveSmokePlacementId: null,
            curveSmokePreviewPoints: [],
            directMovementPlacementId: null,
            directMovementPreview: null,
            anchorMovementPlacementDraft: null,
            blastPackPlacementDraft: null,
            abilityInstancePopoverId: null,
            abilityInstancePopoverAnchor: null,
            abilityPopoverPlacementId: null,
            abilityPopoverAnchor: null,
          };
        }),
      beginBlastPackPlacementFromAgent: (input) =>
        set((s) => {
          const owner = s.mapPlacements.find((p) => p.id === input.ownerPlacementId);
          if (
            !owner ||
            owner.eliminated ||
            !isBlastPackMovementAbility(input.agentId, input.abilitySlot)
          ) {
            return s;
          }
          const range = getMovementRange(input.agentId, input.abilitySlot);
          return {
            blastPackPlacementDraft: {
              ownerPlacementId: input.ownerPlacementId,
              agentId: input.agentId,
              abilitySlot: input.abilitySlot,
              range,
              previewX: owner.x,
              previewY: owner.y,
            },
            sphericalSmokePlacementId: null,
            sphericalSmokePreview: null,
            fixedDualLineSmokePlacementId: null,
            fixedDualLineSmokePreview: null,
            fixedSingleLineSmokePlacementId: null,
            fixedSingleLineSmokePreview: null,
            curveSmokePlacementId: null,
            curveSmokePreviewPoints: [],
            directMovementPlacementId: null,
            directMovementPreview: null,
            anchorMovementPlacementDraft: null,
            blastPackPlacementId: null,
            blastPackPreview: null,
            abilityInstancePopoverId: null,
            abilityInstancePopoverAnchor: null,
            abilityPopoverPlacementId: null,
            abilityPopoverAnchor: null,
          };
        }),
      updateBlastPackPreview: (targetX, targetY) =>
        set((s) => {
          if (s.blastPackPlacementDraft) {
            const draft = s.blastPackPlacementDraft;
            const owner = s.mapPlacements.find((p) => p.id === draft.ownerPlacementId);
            if (!owner) return s;
            const target = clampPointToMovementRange(owner.x, owner.y, targetX, targetY, draft.range);
            return {
              blastPackPlacementDraft: {
                ...draft,
                previewX: target.x,
                previewY: target.y,
              },
            };
          }
          if (!s.blastPackPlacementId) return s;
          const placement = s.abilityPlacements.find((p) => p.id === s.blastPackPlacementId);
          const owner = placement
            ? s.mapPlacements.find((p) => p.id === placement.ownerPlacementId)
            : undefined;
          if (!placement || !owner) return s;
          const range = getMovementRange(placement.agentId, placement.abilitySlot);
          const target = clampPointToMovementRange(owner.x, owner.y, targetX, targetY, range);
          return { blastPackPreview: { x: target.x, y: target.y } };
        }),
      cancelBlastPackPlacement: () =>
        set({
          blastPackPlacementId: null,
          blastPackPreview: null,
          blastPackPlacementDraft: null,
        }),
      confirmBlastPackPlacement: (targetX, targetY) => {
        const state = useMatchupStore.getState();
        const draft = state.blastPackPlacementDraft;
        if (draft) {
          const owner = state.mapPlacements.find((p) => p.id === draft.ownerPlacementId);
          if (!owner) {
            useMatchupStore.setState({ blastPackPlacementDraft: null });
            return;
          }
          const end = clampPointToMovementRange(owner.x, owner.y, targetX, targetY, draft.range);
          useMatchupStore.setState((s) => ({
            abilityPlacements: [
              ...s.abilityPlacements,
              {
                id: crypto.randomUUID(),
                ownerPlacementId: draft.ownerPlacementId,
                agentId: draft.agentId,
                abilitySlot: draft.abilitySlot,
                x: end.x,
                y: end.y,
                state: 'active' as const,
                placedAt: Date.now(),
                anchorMovement: {
                  kind: 'blast-pack' as const,
                  status: 'armed' as const,
                  radius: BLAST_PACK_IMPACT_RADIUS,
                },
              },
            ],
            blastPackPlacementDraft: null,
          }));
          return;
        }
        const { blastPackPlacementId } = state;
        if (!blastPackPlacementId) return;
        const target = state.abilityPlacements.find((p) => p.id === blastPackPlacementId);
        const owner = target
          ? state.mapPlacements.find((p) => p.id === target.ownerPlacementId)
          : undefined;
        if (!target || !owner || !isBlastPackMovementAbility(target.agentId, target.abilitySlot)) {
          useMatchupStore.setState({ blastPackPlacementId: null, blastPackPreview: null });
          return;
        }
        const range = getMovementRange(target.agentId, target.abilitySlot);
        const end = clampPointToMovementRange(owner.x, owner.y, targetX, targetY, range);
        const updated = {
          ...target,
          x: end.x,
          y: end.y,
          state: 'active' as const,
          anchorMovement: {
            kind: 'blast-pack' as const,
            status: 'armed' as const,
            radius: BLAST_PACK_IMPACT_RADIUS,
          },
        };
        useMatchupStore.setState((s) => ({
          abilityPlacements: s.abilityPlacements.map((p) =>
            p.id === blastPackPlacementId ? updated : p
          ),
          blastPackPlacementId: null,
          blastPackPreview: null,
          blastPackPlacementDraft: null,
        }));
      },
      beginAnchorMovementPlacement: (input) =>
        set((s) => {
          const owner = s.mapPlacements.find((p) => p.id === input.ownerPlacementId);
          if (
            !owner ||
            owner.eliminated ||
            !isStaticAnchorMovementAbility(input.agentId, input.abilitySlot)
          ) {
            return s;
          }
          const range = getMovementRange(input.agentId, input.abilitySlot);
          return {
            anchorMovementPlacementDraft: {
              ownerPlacementId: input.ownerPlacementId,
              agentId: input.agentId,
              abilitySlot: input.abilitySlot,
              range,
              previewX: owner.x,
              previewY: owner.y,
            },
            sphericalSmokePlacementId: null,
            sphericalSmokePreview: null,
            fixedDualLineSmokePlacementId: null,
            fixedDualLineSmokePreview: null,
            fixedSingleLineSmokePlacementId: null,
            fixedSingleLineSmokePreview: null,
            curveSmokePlacementId: null,
            curveSmokePreviewPoints: [],
            directMovementPlacementId: null,
            directMovementPreview: null,
            blastPackPlacementId: null,
            blastPackPreview: null,
            abilityInstancePopoverId: null,
            abilityInstancePopoverAnchor: null,
            abilityPopoverPlacementId: null,
            abilityPopoverAnchor: null,
          };
        }),
      updateAnchorMovementPlacementPreview: (targetX, targetY) =>
        set((s) => {
          const draft = s.anchorMovementPlacementDraft;
          if (!draft) return s;
          const owner = s.mapPlacements.find((p) => p.id === draft.ownerPlacementId);
          if (!owner) return s;
          const target = clampPointToMovementRange(owner.x, owner.y, targetX, targetY, draft.range);
          return {
            anchorMovementPlacementDraft: {
              ...draft,
              previewX: target.x,
              previewY: target.y,
            },
          };
        }),
      cancelAnchorMovementPlacement: () =>
        set({
          anchorMovementPlacementDraft: null,
        }),
      confirmAnchorMovementPlacement: (targetX, targetY) => {
        const draft = useMatchupStore.getState().anchorMovementPlacementDraft;
        if (!draft) return;
        const owner = useMatchupStore
          .getState()
          .mapPlacements.find((p) => p.id === draft.ownerPlacementId);
        if (!owner) {
          useMatchupStore.setState({ anchorMovementPlacementDraft: null });
          return;
        }
        const target = clampPointToMovementRange(owner.x, owner.y, targetX, targetY, draft.range);
        useMatchupStore.setState((s) => ({
          abilityPlacements: [
            ...s.abilityPlacements,
            {
              id: crypto.randomUUID(),
              ownerPlacementId: draft.ownerPlacementId,
              agentId: draft.agentId,
              abilitySlot: draft.abilitySlot,
              x: target.x,
              y: target.y,
              state: 'active' as const,
              placedAt: Date.now(),
              anchorMovement: {
                kind: inferMovementAnchorKind(draft.agentId, draft.abilitySlot),
                status: 'armed' as const,
                radius: draft.range,
              },
            },
          ],
          anchorMovementPlacementDraft: null,
        }));
      },
      deployAgentAbility: (input) => {
        const state = useMatchupStore.getState();
        const owner = state.mapPlacements.find((p) => p.id === input.ownerPlacementId);
        if (!owner || owner.eliminated) return;
        const armed = findArmedMovementAbility(
          state.abilityPlacements,
          input.ownerPlacementId,
          input.abilitySlot,
        );
        if (armed) {
          useMatchupStore.getState().triggerArmedMovementAbility(input.ownerPlacementId, input.abilitySlot);
          return;
        }
        if (
          isStaticAnchorMovementAbility(input.agentId, input.abilitySlot) &&
          getMovementKind(input.agentId, input.abilitySlot) === 'rewind'
        ) {
          useMatchupStore.setState((s) => ({
            abilityPlacements: [
              ...s.abilityPlacements,
              {
                id: crypto.randomUUID(),
                ownerPlacementId: input.ownerPlacementId,
                agentId: input.agentId,
                abilitySlot: input.abilitySlot,
                x: owner.x,
                y: owner.y,
                state: 'active' as const,
                placedAt: Date.now(),
                anchorMovement: {
                  kind: 'refract' as const,
                  status: 'armed' as const,
                },
              },
            ],
          }));
          return;
        }
        if (isStaticAnchorMovementAbility(input.agentId, input.abilitySlot)) {
          useMatchupStore.getState().beginAnchorMovementPlacement(input);
          return;
        }
        if (isBlastPackMovementAbility(input.agentId, input.abilitySlot)) {
          useMatchupStore.getState().beginBlastPackPlacementFromAgent(input);
          return;
        }
        useMatchupStore.getState().spawnAbilityAtMapCenter(input);
      },
      triggerArmedMovementAbility: (ownerPlacementId, abilitySlot) => {
        const state = useMatchupStore.getState();
        const owner = state.mapPlacements.find((p) => p.id === ownerPlacementId);
        const armed = findArmedMovementAbility(state.abilityPlacements, ownerPlacementId, abilitySlot);
        if (!owner || owner.eliminated || !armed?.anchorMovement) return;
        const { currentTime, maxTime } = useTimelinePlaybackStore.getState();
        const deployT = quantizeTimelineSeconds(currentTime, maxTime);
        const range = getMovementRange(armed.agentId, armed.abilitySlot);
        const activationDelaySec = getMovementActivationDelaySec(armed.agentId, armed.abilitySlot);
        const blastRadius = armed.anchorMovement.radius ?? BLAST_PACK_IMPACT_RADIUS;
        const impactedPlacements =
          armed.anchorMovement.kind === 'blast-pack'
            ? state.mapPlacements
                .filter((p) => !p.eliminated)
                .map((p) => {
                  const dx = p.x - armed.x;
                  const dy = p.y - armed.y;
                  const dist = Math.hypot(dx, dy);
                  if (dist > blastRadius) return null;
                  const facing = dist > 1e-6 ? Math.atan2(dy, dx) : p.facing;
                  const strength = Math.max(0, 1 - dist / blastRadius);
                  const pushDistance = range * strength;
                  if (pushDistance <= 0) return null;
                  return {
                    placementId: p.id,
                    startX: p.x,
                    startY: p.y,
                    endX: p.x + Math.cos(facing) * pushDistance,
                    endY: p.y + Math.sin(facing) * pushDistance,
                    facing,
                  };
                })
                .filter((entry): entry is NonNullable<typeof entry> => !!entry)
            : [
                {
                  placementId: owner.id,
                  startX: owner.x,
                  startY: owner.y,
                  endX: armed.x,
                  endY: armed.y,
                  facing: Math.atan2(armed.y - owner.y, armed.x - owner.x),
                },
              ];
        const primaryMovement =
          impactedPlacements.find((entry) => entry.placementId === ownerPlacementId) ??
          impactedPlacements[0];
        if (!primaryMovement) return;
        const impactedByPlacementId = new Map(
          impactedPlacements.flatMap((entry) =>
            entry.placementId ? [[entry.placementId, entry] as const] : []
          )
        );
        const directMovement = {
          ...primaryMovement,
          ...(activationDelaySec > 0 ? { activationDelaySec } : {}),
          ...(impactedPlacements.length > 1 ? { impactedPlacements } : {}),
        };
        const updatedAbility = {
          ...armed,
          state: 'active' as const,
          activeAt: deployT,
          directMovement,
          anchorMovement: {
            ...armed.anchorMovement,
            status: 'triggered' as const,
          },
        };
        useMatchupStore.setState((s) => ({
          mapPlacements: s.mapPlacements.map((p) => {
            const movement = impactedByPlacementId.get(p.id);
            return movement
              ? { ...p, x: movement.endX, y: movement.endY, facing: movement.facing }
              : p;
          }),
          abilityPlacements: s.abilityPlacements.map((p) =>
            p.id === armed.id ? updatedAbility : p
          ),
          selectedPlacementId: ownerPlacementId,
          selectedAbilityPlacementId: null,
        }));
        useTimelineKeyframeStore
          .getState()
          .recordAbilityDeployAtTime(deployT, buildAbilityDeployEvent(updatedAbility, 'instant'));
        syncLiveAbilityPlacementsForPlayhead(currentTime);
      },
      spawnAbilityPlacement: (input) =>
        set((s) => ({
          abilityPlacements: [
            ...s.abilityPlacements,
            {
              id: crypto.randomUUID(),
              ownerPlacementId: input.ownerPlacementId,
              agentId: input.agentId,
              abilitySlot: input.abilitySlot,
              x: input.x,
              y: input.y,
              state: 'initial',
              placedAt: Date.now(),
            },
          ],
        })),
      spawnAbilityAtMapCenter: (input) =>
        set((s) => {
          const { x, y } = nextAbilitySpawnPoint(s.abilityPlacements);
          const placedAt = Date.now();
          return {
            abilityPlacements: [
              ...s.abilityPlacements,
              {
                id: crypto.randomUUID(),
                ownerPlacementId: input.ownerPlacementId,
                agentId: input.agentId,
                abilitySlot: input.abilitySlot,
                x,
                y,
                state: 'initial' as const,
                placedAt,
              },
            ],
          };
        }),
      dragDropTargetSide: 'attack',
      setDragDropTargetSide: (side) => set({ dragDropTargetSide: side }),

      addAgent: (side, agentId) =>
        set((s) => {
          if (side === 'attack' && s.attackAgentIds.includes(agentId)) return s;
          if (side === 'defense' && s.defenseAgentIds.includes(agentId)) return s;
          const attackAgentIds =
            side === 'attack' ? [...s.attackAgentIds, agentId] : s.attackAgentIds;
          const defenseAgentIds =
            side === 'defense' ? [...s.defenseAgentIds, agentId] : s.defenseAgentIds;
          const mapPlacements = reconcileMapPlacements(
            attackAgentIds,
            defenseAgentIds,
            s.mapPlacements
          );
          return {
            attackAgentIds,
            defenseAgentIds,
            mapPlacements,
            selectedPlacementId: pickSelectionAfterPlacements(s.selectedPlacementId, mapPlacements),
          };
        }),

      removeAgent: (side, agentId) =>
        set((s) => {
          const attackAgentIds =
            side === 'attack' ? s.attackAgentIds.filter((id) => id !== agentId) : s.attackAgentIds;
          const defenseAgentIds =
            side === 'defense'
              ? s.defenseAgentIds.filter((id) => id !== agentId)
              : s.defenseAgentIds;
          const mapPlacements = reconcileMapPlacements(
            attackAgentIds,
            defenseAgentIds,
            s.mapPlacements
          );
          return {
            attackAgentIds,
            defenseAgentIds,
            mapPlacements,
            selectedPlacementId: pickSelectionAfterPlacements(s.selectedPlacementId, mapPlacements),
          };
        }),

      patchMapPlacement: (id, patch) =>
        set((s) => ({
          mapPlacements: s.mapPlacements.map((p) =>
            p.id === id ? { ...p, ...patch } : p
          ),
        })),
      patchAbilityPlacement: (id, patch) =>
        set((s) => ({
          abilityPlacements: s.abilityPlacements.map((p) =>
            p.id === id ? { ...p, ...patch } : p
          ),
        })),
      removeAbilityPlacement: (id) => {
        useTimelineKeyframeStore.getState().purgeAbilityPlacementFromTimeline(id);
      },
      recallAbilityPlacement: (id) => {
        const target = useMatchupStore.getState().abilityPlacements.find((p) => p.id === id);
        if (!target) return;
        // TODO(buy-loadout): 将 target.abilitySlot 技能点退还给 target.ownerPlacementId
        useTimelineKeyframeStore.getState().purgeAbilityPlacementFromTimeline(id);
      },
    }),
    {
      name: 'valorant-matchup',
      partialize: (s) => ({
        attackAgentIds: s.attackAgentIds,
        defenseAgentIds: s.defenseAgentIds,
        dragDropTargetSide: s.dragDropTargetSide,
        mapPlacements: s.mapPlacements,
        abilityPlacements: s.abilityPlacements,
      }),
      merge: (persisted, current) => {
        const p = persisted as
          | Partial<
              Pick<
                MatchupState,
                | 'attackAgentIds'
                | 'defenseAgentIds'
                | 'dragDropTargetSide'
                | 'mapPlacements'
                | 'abilityPlacements'
              >
            >
          | undefined;
        const sideOk =
          p?.dragDropTargetSide === 'attack' || p?.dragDropTargetSide === 'defense'
            ? p.dragDropTargetSide
            : current.dragDropTargetSide;
        const attackAgentIds = Array.isArray(p?.attackAgentIds)
          ? p.attackAgentIds
          : current.attackAgentIds;
        const defenseAgentIds = Array.isArray(p?.defenseAgentIds)
          ? p.defenseAgentIds
          : current.defenseAgentIds;
        const rawPlacements = Array.isArray(p?.mapPlacements) ? p.mapPlacements : [];
        const abilityPlacements = normalizeAbilityPlacements(p?.abilityPlacements);
        return {
          ...current,
          attackAgentIds,
          defenseAgentIds,
          dragDropTargetSide: sideOk,
          mapPlacements: reconcileMapPlacements(
            attackAgentIds,
            defenseAgentIds,
            rawPlacements
          ),
          abilityPlacements,
        };
      },
    }
    ),
    { name: 'MatchupStore', enabled: import.meta.env.DEV }
  )
);
