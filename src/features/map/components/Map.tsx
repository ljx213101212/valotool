import { useDroppable } from '@dnd-kit/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import type Konva from 'konva';
import { valorantMap } from '@/shared/data/valorantMap';
import { MAP_DROP_ZONE_ID } from '@/shared/constants/dnd';
import { useMapSelectionStore } from '@/shared/store/useMapSelectionStore';
import { Circle, Layer, Line, Shape, Stage } from 'react-konva';
import {
  getFixedDualLineSmokeColor,
  getFixedDualLineSmokeLength,
  getFixedDualLineSmokeSpacing,
  getFixedDualLineSmokeStrokeWidth,
  getDrawableCurveMaxLength,
  getFixedSingleLineSmokeLength,
  getLineSmokeColor,
  getLineSmokeStrokeWidth,
  getMovementRange,
  getSphericalSmokeRadius,
  getSphericalSmokeVariant,
  isDrawableCurveSmokeAbility,
  isFixedDualLineSmokeAbility,
  isFixedSingleLineSmokeAbility,
  isSphericalSmokeAbility,
  smokeMapUnitsFromMeters,
} from '@/features/abilities/config';
import {
  formatSmokeCatalogForLog,
  listLineSmokeCatalog,
  listSphereSmokeCatalog,
  type SmokeCatalogEntry,
} from '@/features/abilities/smokeCatalog';
import { AbilityDetailDrawer } from '@/features/abilities/components/AbilityDetailDrawer';
import { AgentAbilityPopover } from '@/features/agents/components/AgentAbilityPopover';
import { AbilityInstanceActionPopover } from '@/features/map/components/AbilityInstanceActionPopover';
import { AgentDetailDrawer } from '@/features/agents/components/AgentDetailDrawer';
import { message } from 'antd';
import { useMatchupStore } from '@/shared/store/useMatchupStore';
import { nextAbilitySpawnPoint } from '@/shared/utils/abilitySpawnPosition';
import { useTimelinePlaybackStore } from '@/shared/store/timelinePlaybackStore';
import { isDeployedAbilityVisibleAtPlayhead } from '@/shared/utils/timelineAbilityMutations';
import { clientPointToMapStage } from '@/shared/utils/mapStagePointer';
import {
  directMovementFromPlacement,
} from '@/shared/utils/directMovementGeometry';
import { timelineTimesEqualStep } from '@/shared/utils/timelineQuantize';
import {
  appendCurvePoint,
  curveSmokeFromPlacement,
  isValidCurveSmokePoints,
} from '@/shared/utils/curveSmokeGeometry';
import { lineSmokeFromPlacement } from '@/shared/utils/lineSmokeGeometry';
import { MapAbilityToken } from './MapAbilityToken';
import { MapCurveSmoke } from './MapCurveSmoke';
import { MapDirectMovement } from './MapDirectMovement';
import { MapFixedDualLineSmoke } from './MapFixedDualLineSmoke';
import { MapFixedSingleLineSmoke } from './MapFixedSingleLineSmoke';
import { MapHeroToken } from './MapHeroToken';
import { MapSphericalSmoke } from './MapSphericalSmoke';
import './Map.less';

const Map = () => {
  const side = useMapSelectionStore((s) => s.side);
  const mapPlacements = useMatchupStore((s) => s.mapPlacements);
  const abilityPlacements = useMatchupStore((s) => s.abilityPlacements);
  const selectedPlacementId = useMatchupStore((s) => s.selectedPlacementId);
  const setSelectedPlacementId = useMatchupStore((s) => s.setSelectedPlacementId);
  const selectedAbilityPlacementId = useMatchupStore((s) => s.selectedAbilityPlacementId);
  const setSelectedAbilityPlacementId = useMatchupStore((s) => s.setSelectedAbilityPlacementId);
  const abilityPopoverPlacementId = useMatchupStore((s) => s.abilityPopoverPlacementId);
  const abilityPopoverAnchor = useMatchupStore((s) => s.abilityPopoverAnchor);
  const openAbilityPopover = useMatchupStore((s) => s.openAbilityPopover);
  const closeAbilityPopover = useMatchupStore((s) => s.closeAbilityPopover);
  const abilityInstancePopoverId = useMatchupStore((s) => s.abilityInstancePopoverId);
  const abilityInstancePopoverAnchor = useMatchupStore((s) => s.abilityInstancePopoverAnchor);
  const openAbilityInstancePopover = useMatchupStore((s) => s.openAbilityInstancePopover);
  const closeAbilityInstancePopover = useMatchupStore((s) => s.closeAbilityInstancePopover);
  const sphericalSmokePlacementId = useMatchupStore((s) => s.sphericalSmokePlacementId);
  const sphericalSmokePreview = useMatchupStore((s) => s.sphericalSmokePreview);
  const updateSphericalSmokePreview = useMatchupStore((s) => s.updateSphericalSmokePreview);
  const cancelSphericalSmokePlacement = useMatchupStore((s) => s.cancelSphericalSmokePlacement);
  const confirmSphericalSmokePlacement = useMatchupStore((s) => s.confirmSphericalSmokePlacement);
  const fixedDualLineSmokePlacementId = useMatchupStore((s) => s.fixedDualLineSmokePlacementId);
  const fixedDualLineSmokePreview = useMatchupStore((s) => s.fixedDualLineSmokePreview);
  const updateFixedDualLineSmokePreview = useMatchupStore((s) => s.updateFixedDualLineSmokePreview);
  const cancelFixedDualLineSmokePlacement = useMatchupStore(
    (s) => s.cancelFixedDualLineSmokePlacement
  );
  const confirmFixedDualLineSmokePlacement = useMatchupStore(
    (s) => s.confirmFixedDualLineSmokePlacement
  );
  const fixedSingleLineSmokePlacementId = useMatchupStore(
    (s) => s.fixedSingleLineSmokePlacementId
  );
  const fixedSingleLineSmokePreview = useMatchupStore((s) => s.fixedSingleLineSmokePreview);
  const updateFixedSingleLineSmokePreview = useMatchupStore(
    (s) => s.updateFixedSingleLineSmokePreview
  );
  const cancelFixedSingleLineSmokePlacement = useMatchupStore(
    (s) => s.cancelFixedSingleLineSmokePlacement
  );
  const confirmFixedSingleLineSmokePlacement = useMatchupStore(
    (s) => s.confirmFixedSingleLineSmokePlacement
  );
  const curveSmokePlacementId = useMatchupStore((s) => s.curveSmokePlacementId);
  const curveSmokePreviewPoints = useMatchupStore((s) => s.curveSmokePreviewPoints);
  const setCurveSmokePreviewPoints = useMatchupStore((s) => s.setCurveSmokePreviewPoints);
  const cancelCurveSmokePlacement = useMatchupStore((s) => s.cancelCurveSmokePlacement);
  const confirmCurveSmokePlacement = useMatchupStore((s) => s.confirmCurveSmokePlacement);
  const directMovementPlacementId = useMatchupStore((s) => s.directMovementPlacementId);
  const directMovementPreview = useMatchupStore((s) => s.directMovementPreview);
  const updateDirectMovementPreview = useMatchupStore((s) => s.updateDirectMovementPreview);
  const cancelDirectMovementPlacement = useMatchupStore((s) => s.cancelDirectMovementPlacement);
  const confirmDirectMovementPlacement = useMatchupStore((s) => s.confirmDirectMovementPlacement);
  const anchorMovementPlacementDraft = useMatchupStore((s) => s.anchorMovementPlacementDraft);
  const updateAnchorMovementPlacementPreview = useMatchupStore(
    (s) => s.updateAnchorMovementPlacementPreview
  );
  const cancelAnchorMovementPlacement = useMatchupStore((s) => s.cancelAnchorMovementPlacement);
  const confirmAnchorMovementPlacement = useMatchupStore((s) => s.confirmAnchorMovementPlacement);
  const blastPackPlacementId = useMatchupStore((s) => s.blastPackPlacementId);
  const blastPackPreview = useMatchupStore((s) => s.blastPackPreview);
  const updateBlastPackPreview = useMatchupStore((s) => s.updateBlastPackPreview);
  const cancelBlastPackPlacement = useMatchupStore((s) => s.cancelBlastPackPlacement);
  const confirmBlastPackPlacement = useMatchupStore((s) => s.confirmBlastPackPlacement);
  const spawnAbilityPlacement = useMatchupStore((s) => s.spawnAbilityPlacement);
  const curveDrawingRef = useRef(false);
  const timelineCurrentTime = useTimelinePlaybackStore((s) => s.currentTime);
  const timelineMaxTime = useTimelinePlaybackStore((s) => s.maxTime);
  const mapWidth = valorantMap.bounds.max.x - valorantMap.bounds.min.x + 100;
  const mapHeight = valorantMap.bounds.max.y - valorantMap.bounds.min.y + 100;
  const defense = side === 'defense';
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const agentAbilityPopoverRef = useRef<HTMLDivElement>(null);
  const abilityInstancePopoverRef = useRef<HTMLDivElement>(null);
  const [mapTransformLocked, setMapTransformLocked] = useState(false);

  const placingSphericalSmoke = !!sphericalSmokePlacementId && !!sphericalSmokePreview;
  const placingFixedDualLineSmoke =
    !!fixedDualLineSmokePlacementId && !!fixedDualLineSmokePreview;
  const placingFixedSingleLineSmoke =
    !!fixedSingleLineSmokePlacementId && !!fixedSingleLineSmokePreview;
  const placingCurveSmoke = !!curveSmokePlacementId;
  const placingDirectMovement = !!directMovementPlacementId && !!directMovementPreview;
  const placingAnchorMovement = !!anchorMovementPlacementDraft;
  const placingBlastPack = !!blastPackPlacementId && !!blastPackPreview;
  const placingSmoke =
    placingSphericalSmoke ||
    placingFixedDualLineSmoke ||
    placingFixedSingleLineSmoke ||
    placingCurveSmoke;
  const placingAbilityEffect =
    placingSmoke || placingDirectMovement || placingAnchorMovement || placingBlastPack;

  const sphericalSmokePlacement = useMemo(
    () =>
      sphericalSmokePlacementId
        ? abilityPlacements.find((p) => p.id === sphericalSmokePlacementId)
        : undefined,
    [abilityPlacements, sphericalSmokePlacementId]
  );

  const sphericalSmokeSide = useMemo(() => {
    if (!sphericalSmokePlacement) return 'attack' as const;
    const owner = mapPlacements.find((p) => p.id === sphericalSmokePlacement.ownerPlacementId);
    return owner?.side ?? 'attack';
  }, [mapPlacements, sphericalSmokePlacement]);

  const sphericalSmokeRadius = useMemo(() => {
    if (!sphericalSmokePlacement) return 55;
    return getSphericalSmokeRadius(
      sphericalSmokePlacement.agentId,
      sphericalSmokePlacement.abilitySlot
    );
  }, [sphericalSmokePlacement]);

  const fixedDualLineSmokePlacement = useMemo(
    () =>
      fixedDualLineSmokePlacementId
        ? abilityPlacements.find((p) => p.id === fixedDualLineSmokePlacementId)
        : undefined,
    [abilityPlacements, fixedDualLineSmokePlacementId]
  );

  const fixedDualLineMeta = useMemo(() => {
    if (!fixedDualLineSmokePlacement) return null;
    const { agentId, abilitySlot } = fixedDualLineSmokePlacement;
    return {
      length: getFixedDualLineSmokeLength(agentId, abilitySlot),
      spacing: getFixedDualLineSmokeSpacing(agentId, abilitySlot),
      strokeWidth: getFixedDualLineSmokeStrokeWidth(agentId, abilitySlot),
      color: getFixedDualLineSmokeColor(agentId, abilitySlot),
    };
  }, [fixedDualLineSmokePlacement]);

  const fixedSingleLineSmokePlacement = useMemo(
    () =>
      fixedSingleLineSmokePlacementId
        ? abilityPlacements.find((p) => p.id === fixedSingleLineSmokePlacementId)
        : undefined,
    [abilityPlacements, fixedSingleLineSmokePlacementId]
  );

  const fixedSingleLineMeta = useMemo(() => {
    if (!fixedSingleLineSmokePlacement) return null;
    const { agentId, abilitySlot } = fixedSingleLineSmokePlacement;
    return {
      length: getFixedSingleLineSmokeLength(agentId, abilitySlot),
      strokeWidth: getLineSmokeStrokeWidth(agentId, abilitySlot),
      color: getLineSmokeColor(agentId, abilitySlot),
    };
  }, [fixedSingleLineSmokePlacement]);

  const curveSmokePlacement = useMemo(
    () =>
      curveSmokePlacementId
        ? abilityPlacements.find((p) => p.id === curveSmokePlacementId)
        : undefined,
    [abilityPlacements, curveSmokePlacementId]
  );

  const curveSmokeMeta = useMemo(() => {
    if (!curveSmokePlacement) return null;
    const { agentId, abilitySlot } = curveSmokePlacement;
    return {
      strokeWidth: getLineSmokeStrokeWidth(agentId, abilitySlot),
      color: getLineSmokeColor(agentId, abilitySlot),
      maxLength: getDrawableCurveMaxLength(agentId, abilitySlot),
    };
  }, [curveSmokePlacement]);

  const directMovementPlacement = useMemo(
    () =>
      directMovementPlacementId
        ? abilityPlacements.find((p) => p.id === directMovementPlacementId)
        : undefined,
    [abilityPlacements, directMovementPlacementId]
  );

  const directMovementOwner = useMemo(() => {
    if (!directMovementPlacement) return undefined;
    return mapPlacements.find((p) => p.id === directMovementPlacement.ownerPlacementId);
  }, [directMovementPlacement, mapPlacements]);

  const directMovementSide = directMovementOwner?.side ?? 'attack';

  const anchorMovementOwner = useMemo(() => {
    if (!anchorMovementPlacementDraft) return undefined;
    return mapPlacements.find((p) => p.id === anchorMovementPlacementDraft.ownerPlacementId);
  }, [anchorMovementPlacementDraft, mapPlacements]);

  const blastPackPlacement = useMemo(
    () =>
      blastPackPlacementId
        ? abilityPlacements.find((p) => p.id === blastPackPlacementId)
        : undefined,
    [abilityPlacements, blastPackPlacementId]
  );

  const blastPackOwner = useMemo(() => {
    if (!blastPackPlacement) return undefined;
    return mapPlacements.find((p) => p.id === blastPackPlacement.ownerPlacementId);
  }, [blastPackPlacement, mapPlacements]);

  const sphericalSmokeVariant = useMemo(() => {
    if (!sphericalSmokePlacement) return 'default' as const;
    return getSphericalSmokeVariant(
      sphericalSmokePlacement.agentId,
      sphericalSmokePlacement.abilitySlot
    );
  }, [sphericalSmokePlacement]);

  const { setNodeRef, isOver } = useDroppable({ id: MAP_DROP_ZONE_ID });

  const agentPopoverPlacement = abilityPopoverPlacementId
    ? mapPlacements.find((p) => p.id === abilityPopoverPlacementId)
    : undefined;

  const abilityInstancePopoverPlacement = abilityInstancePopoverId
    ? abilityPlacements.find((p) => p.id === abilityInstancePopoverId)
    : undefined;

  const closeAllMapPopovers = useCallback(() => {
    closeAbilityPopover();
    closeAbilityInstancePopover();
  }, [closeAbilityPopover, closeAbilityInstancePopover]);

  const lockMapTransformForPlacementEffect = useCallback(() => {
    const timer = window.setTimeout(() => setMapTransformLocked(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!abilityPopoverPlacementId) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = agentAbilityPopoverRef.current;
      if (el?.contains(e.target as Node)) return;
      closeAbilityPopover();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [abilityPopoverPlacementId, closeAbilityPopover]);

  useEffect(() => {
    if (!abilityInstancePopoverId) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = abilityInstancePopoverRef.current;
      if (el?.contains(e.target as Node)) return;
      closeAbilityInstancePopover();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [abilityInstancePopoverId, closeAbilityInstancePopover]);

  useEffect(() => {
    if (!abilityPopoverPlacementId && !abilityInstancePopoverId && !placingAbilityEffect) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (placingSphericalSmoke) {
        cancelSphericalSmokePlacement();
        return;
      }
      if (placingFixedDualLineSmoke) {
        cancelFixedDualLineSmokePlacement();
        return;
      }
      if (placingFixedSingleLineSmoke) {
        cancelFixedSingleLineSmokePlacement();
        return;
      }
      if (placingCurveSmoke) {
        curveDrawingRef.current = false;
        cancelCurveSmokePlacement();
        return;
      }
      if (placingDirectMovement) {
        cancelDirectMovementPlacement();
        return;
      }
      if (placingAnchorMovement) {
        cancelAnchorMovementPlacement();
        return;
      }
      if (placingBlastPack) {
        cancelBlastPackPlacement();
        return;
      }
      closeAllMapPopovers();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    abilityPopoverPlacementId,
    abilityInstancePopoverId,
    placingAbilityEffect,
    placingSphericalSmoke,
    placingFixedDualLineSmoke,
    placingFixedSingleLineSmoke,
    placingCurveSmoke,
    placingDirectMovement,
    placingAnchorMovement,
    placingBlastPack,
    cancelSphericalSmokePlacement,
    cancelFixedDualLineSmokePlacement,
    cancelFixedSingleLineSmokePlacement,
    cancelCurveSmokePlacement,
    cancelDirectMovementPlacement,
    cancelAnchorMovementPlacement,
    cancelBlastPackPlacement,
    closeAllMapPopovers,
  ]);

  const syncSphericalSmokePreviewFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const pt = clientPointToMapStage(stage, clientX, clientY);
      if (!pt) return;
      updateSphericalSmokePreview(pt.x, pt.y);
    },
    [updateSphericalSmokePreview]
  );

  const syncFixedDualLinePreviewFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const stage = stageRef.current;
      if (!stage || !fixedDualLineSmokePlacement) return;
      const pt = clientPointToMapStage(stage, clientX, clientY);
      if (!pt) return;
      const owner = mapPlacements.find(
        (p) => p.id === fixedDualLineSmokePlacement.ownerPlacementId
      );
      const facing = owner
        ? Math.atan2(pt.y - owner.y, pt.x - owner.x)
        : fixedDualLineSmokePreview?.facing ?? 0;
      updateFixedDualLineSmokePreview(pt.x, pt.y, facing);
    },
    [
      fixedDualLineSmokePlacement,
      fixedDualLineSmokePreview?.facing,
      mapPlacements,
      updateFixedDualLineSmokePreview,
    ]
  );

  const syncFixedSingleLinePreviewFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const stage = stageRef.current;
      if (!stage || !fixedSingleLineSmokePlacement) return;
      const pt = clientPointToMapStage(stage, clientX, clientY);
      if (!pt) return;
      const owner = mapPlacements.find(
        (p) => p.id === fixedSingleLineSmokePlacement.ownerPlacementId
      );
      const facing = owner
        ? Math.atan2(pt.y - owner.y, pt.x - owner.x)
        : (fixedSingleLineSmokePreview?.facing ?? 0);
      updateFixedSingleLineSmokePreview(pt.x, pt.y, facing);
    },
    [
      fixedSingleLineSmokePlacement,
      fixedSingleLineSmokePreview?.facing,
      mapPlacements,
      updateFixedSingleLineSmokePreview,
    ]
  );

  const syncDirectMovementPreviewFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const pt = clientPointToMapStage(stage, clientX, clientY);
      if (!pt) return;
      updateDirectMovementPreview(pt.x, pt.y);
    },
    [updateDirectMovementPreview]
  );

  const syncAnchorMovementPreviewFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const pt = clientPointToMapStage(stage, clientX, clientY);
      if (!pt) return;
      updateAnchorMovementPlacementPreview(pt.x, pt.y);
    },
    [updateAnchorMovementPlacementPreview]
  );

  const syncBlastPackPreviewFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const pt = clientPointToMapStage(stage, clientX, clientY);
      if (!pt) return;
      updateBlastPackPreview(pt.x, pt.y);
    },
    [updateBlastPackPreview]
  );

  useEffect(() => {
    if (!placingSphericalSmoke) return;
    const cancelTransformLock = lockMapTransformForPlacementEffect();
    const onMove = (e: PointerEvent) => {
      syncSphericalSmokePreviewFromClient(e.clientX, e.clientY);
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const stage = stageRef.current;
      if (!stage) return;
      const container = stage.container();
      if (!container.contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      const pt = clientPointToMapStage(stage, e.clientX, e.clientY);
      if (!pt) return;
      confirmSphericalSmokePlacement(pt.x, pt.y);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown, true);
      cancelTransformLock();
      setMapTransformLocked(false);
    };
  }, [
    placingSphericalSmoke,
    lockMapTransformForPlacementEffect,
    syncSphericalSmokePreviewFromClient,
    confirmSphericalSmokePlacement,
  ]);

  useEffect(() => {
    if (!placingFixedDualLineSmoke) return;
    const cancelTransformLock = lockMapTransformForPlacementEffect();
    const onMove = (e: PointerEvent) => {
      syncFixedDualLinePreviewFromClient(e.clientX, e.clientY);
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const stage = stageRef.current;
      if (!stage) return;
      const container = stage.container();
      if (!container.contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      const pt = clientPointToMapStage(stage, e.clientX, e.clientY);
      if (!pt || !fixedDualLineSmokePlacement) return;
      const owner = mapPlacements.find(
        (p) => p.id === fixedDualLineSmokePlacement.ownerPlacementId
      );
      const facing = owner
        ? Math.atan2(pt.y - owner.y, pt.x - owner.x)
        : (fixedDualLineSmokePreview?.facing ?? 0);
      confirmFixedDualLineSmokePlacement(pt.x, pt.y, facing);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown, true);
      cancelTransformLock();
      setMapTransformLocked(false);
    };
  }, [
    placingFixedDualLineSmoke,
    lockMapTransformForPlacementEffect,
    fixedDualLineSmokePlacement,
    fixedDualLineSmokePreview?.facing,
    mapPlacements,
    syncFixedDualLinePreviewFromClient,
    confirmFixedDualLineSmokePlacement,
  ]);

  useEffect(() => {
    if (!placingFixedSingleLineSmoke) return;
    const cancelTransformLock = lockMapTransformForPlacementEffect();
    const onMove = (e: PointerEvent) => {
      syncFixedSingleLinePreviewFromClient(e.clientX, e.clientY);
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const stage = stageRef.current;
      if (!stage) return;
      const container = stage.container();
      if (!container.contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      const pt = clientPointToMapStage(stage, e.clientX, e.clientY);
      if (!pt || !fixedSingleLineSmokePlacement) return;
      const owner = mapPlacements.find(
        (p) => p.id === fixedSingleLineSmokePlacement.ownerPlacementId
      );
      const facing = owner
        ? Math.atan2(pt.y - owner.y, pt.x - owner.x)
        : (fixedSingleLineSmokePreview?.facing ?? 0);
      confirmFixedSingleLineSmokePlacement(pt.x, pt.y, facing);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown, true);
      cancelTransformLock();
      setMapTransformLocked(false);
    };
  }, [
    placingFixedSingleLineSmoke,
    lockMapTransformForPlacementEffect,
    fixedSingleLineSmokePlacement,
    fixedSingleLineSmokePreview?.facing,
    mapPlacements,
    syncFixedSingleLinePreviewFromClient,
    confirmFixedSingleLineSmokePlacement,
  ]);

  useEffect(() => {
    if (!placingDirectMovement) return;
    const cancelTransformLock = lockMapTransformForPlacementEffect();
    const onMove = (e: PointerEvent) => {
      syncDirectMovementPreviewFromClient(e.clientX, e.clientY);
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const stage = stageRef.current;
      if (!stage) return;
      const container = stage.container();
      if (!container.contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      const pt = clientPointToMapStage(stage, e.clientX, e.clientY);
      if (!pt) return;
      confirmDirectMovementPlacement(pt.x, pt.y);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown, true);
      cancelTransformLock();
      setMapTransformLocked(false);
    };
  }, [
    placingDirectMovement,
    lockMapTransformForPlacementEffect,
    syncDirectMovementPreviewFromClient,
    confirmDirectMovementPlacement,
  ]);

  useEffect(() => {
    if (!placingAnchorMovement) return;
    const cancelTransformLock = lockMapTransformForPlacementEffect();
    const onMove = (e: PointerEvent) => {
      syncAnchorMovementPreviewFromClient(e.clientX, e.clientY);
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const stage = stageRef.current;
      if (!stage) return;
      const container = stage.container();
      if (!container.contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      const pt = clientPointToMapStage(stage, e.clientX, e.clientY);
      if (!pt) return;
      confirmAnchorMovementPlacement(pt.x, pt.y);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown, true);
      cancelTransformLock();
      setMapTransformLocked(false);
    };
  }, [
    placingAnchorMovement,
    lockMapTransformForPlacementEffect,
    syncAnchorMovementPreviewFromClient,
    confirmAnchorMovementPlacement,
  ]);

  useEffect(() => {
    if (!placingBlastPack) return;
    const cancelTransformLock = lockMapTransformForPlacementEffect();
    const onMove = (e: PointerEvent) => {
      syncBlastPackPreviewFromClient(e.clientX, e.clientY);
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const stage = stageRef.current;
      if (!stage) return;
      const container = stage.container();
      if (!container.contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      const pt = clientPointToMapStage(stage, e.clientX, e.clientY);
      if (!pt) return;
      confirmBlastPackPlacement(pt.x, pt.y);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown, true);
      cancelTransformLock();
      setMapTransformLocked(false);
    };
  }, [
    placingBlastPack,
    lockMapTransformForPlacementEffect,
    syncBlastPackPreviewFromClient,
    confirmBlastPackPlacement,
  ]);

  useEffect(() => {
    if (!placingCurveSmoke) return;
    const cancelTransformLock = lockMapTransformForPlacementEffect();
    curveDrawingRef.current = false;

    const stagePoint = (clientX: number, clientY: number) => {
      const stage = stageRef.current;
      if (!stage) return null;
      return clientPointToMapStage(stage, clientX, clientY);
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const stage = stageRef.current;
      if (!stage) return;
      const container = stage.container();
      if (!container.contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      const pt = stagePoint(e.clientX, e.clientY);
      if (!pt) return;
      curveDrawingRef.current = true;
      setCurveSmokePreviewPoints([pt.x, pt.y]);
    };

    const maxLength = curveSmokeMeta?.maxLength ?? smokeMapUnitsFromMeters(18);

    const onMove = (e: PointerEvent) => {
      if (!curveDrawingRef.current || (e.buttons & 1) === 0) return;
      const pt = stagePoint(e.clientX, e.clientY);
      if (!pt) return;
      const prev = useMatchupStore.getState().curveSmokePreviewPoints;
      setCurveSmokePreviewPoints(appendCurvePoint(prev, pt.x, pt.y, maxLength));
    };

    const onUp = () => {
      if (!curveDrawingRef.current) return;
      curveDrawingRef.current = false;
      const points = useMatchupStore.getState().curveSmokePreviewPoints;
      if (isValidCurveSmokePoints(points)) {
        confirmCurveSmokePlacement(points);
      } else {
        setCurveSmokePreviewPoints([]);
      }
    };

    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      curveDrawingRef.current = false;
      cancelTransformLock();
      setMapTransformLocked(false);
    };
  }, [
    placingCurveSmoke,
    lockMapTransformForPlacementEffect,
    curveSmokeMeta?.maxLength,
    setCurveSmokePreviewPoints,
    confirmCurveSmokePlacement,
  ]);

  useEffect(() => {
    if (!abilityPopoverPlacementId) return;
    const stillThere = mapPlacements.some(
      (p) => p.id === abilityPopoverPlacementId && !p.eliminated
    );
    if (!stillThere) closeAbilityPopover();
  }, [abilityPopoverPlacementId, mapPlacements, closeAbilityPopover]);

  useEffect(() => {
    if (!abilityInstancePopoverId) return;
    if (!abilityPlacements.some((p) => p.id === abilityInstancePopoverId)) {
      closeAbilityInstancePopover();
    }
  }, [abilityInstancePopoverId, abilityPlacements, closeAbilityInstancePopover]);

  useEffect(() => {
    if (!sphericalSmokePlacementId) return;
    if (!abilityPlacements.some((p) => p.id === sphericalSmokePlacementId)) {
      cancelSphericalSmokePlacement();
    }
  }, [sphericalSmokePlacementId, abilityPlacements, cancelSphericalSmokePlacement]);

  useEffect(() => {
    if (!fixedDualLineSmokePlacementId) return;
    if (!abilityPlacements.some((p) => p.id === fixedDualLineSmokePlacementId)) {
      cancelFixedDualLineSmokePlacement();
    }
  }, [fixedDualLineSmokePlacementId, abilityPlacements, cancelFixedDualLineSmokePlacement]);

  useEffect(() => {
    if (!fixedSingleLineSmokePlacementId) return;
    if (!abilityPlacements.some((p) => p.id === fixedSingleLineSmokePlacementId)) {
      cancelFixedSingleLineSmokePlacement();
    }
  }, [fixedSingleLineSmokePlacementId, abilityPlacements, cancelFixedSingleLineSmokePlacement]);

  useEffect(() => {
    if (!curveSmokePlacementId) return;
    if (!abilityPlacements.some((p) => p.id === curveSmokePlacementId)) {
      cancelCurveSmokePlacement();
    }
  }, [curveSmokePlacementId, abilityPlacements, cancelCurveSmokePlacement]);

  useEffect(() => {
    if (!directMovementPlacementId) return;
    if (!abilityPlacements.some((p) => p.id === directMovementPlacementId)) {
      cancelDirectMovementPlacement();
    }
  }, [directMovementPlacementId, abilityPlacements, cancelDirectMovementPlacement]);

  useEffect(() => {
    if (!blastPackPlacementId) return;
    if (!abilityPlacements.some((p) => p.id === blastPackPlacementId)) {
      cancelBlastPackPlacement();
    }
  }, [blastPackPlacementId, abilityPlacements, cancelBlastPackPlacement]);

  useEffect(() => {
    if (!placingAbilityEffect) return;
    const stage = stageRef.current;
    const el = stage?.container();
    if (!el) return;
    const prev = el.style.cursor;
    el.style.cursor = 'crosshair';
    return () => {
      el.style.cursor = prev;
    };
  }, [placingAbilityEffect]);

  const handleMapTransform = useCallback(() => {
    closeAllMapPopovers();
  }, [closeAllMapPopovers]);

  useEffect(() => {
    if (!mapTransformLocked) return;
    const release = () => setMapTransformLocked(false);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('blur', release);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('blur', release);
    };
  }, [mapTransformLocked]);

  const handleClearLocalStorage = useCallback(() => {
    if (!window.confirm('清空 localStorage 并刷新页面？')) return;
    localStorage.clear();
    window.location.reload();
  }, []);

  const spawnSmokeCatalogOnMap = useCallback(
    (label: string, entries: SmokeCatalogEntry[]) => {
      const owner = mapPlacements.find((p) => !p.eliminated) ?? mapPlacements[0];
      if (!owner) {
        message.warning('请先在地图上放置至少一名特工');
        return;
      }
      let existing = useMatchupStore.getState().abilityPlacements;
      for (const entry of entries) {
        const { x, y } = nextAbilitySpawnPoint(existing);
        spawnAbilityPlacement({
          ownerPlacementId: owner.id,
          agentId: entry.agentSlug,
          abilitySlot: entry.slot,
          x,
          y,
        });
        existing = useMatchupStore.getState().abilityPlacements;
      }
      console.group(`[valotool] ${label}（${entries.length}）`);
      console.table(
        entries.map((e) => ({
          agent: e.agentSlug,
          slot: e.slot,
          name: e.displayName,
          kinds: e.effectKinds.join(', '),
        })),
      );
      console.log(formatSmokeCatalogForLog(entries));
      console.groupEnd();
      message.success(`已放置 ${entries.length} 个${label}（预备期 token）`);
    },
    [mapPlacements, spawnAbilityPlacement],
  );

  const handleListLineSmokeCatalog = useCallback(() => {
    spawnSmokeCatalogOnMap('线烟道具', listLineSmokeCatalog());
  }, [spawnSmokeCatalogOnMap]);

  const handleListSphereSmokeCatalog = useCallback(() => {
    spawnSmokeCatalogOnMap('球烟道具', listSphereSmokeCatalog());
  }, [spawnSmokeCatalogOnMap]);

  return (
    <div
      ref={setNodeRef}
      className={`map-root${isOver ? ' map-root--drop-over' : ''}`}
    >
      {import.meta.env.DEV ? (
        <div className="map-debug-toolbar" role="toolbar" aria-label="地图调试">
          <button
            type="button"
            className="map-debug-toolbar__btn map-debug-toolbar__btn--line"
            onClick={handleListLineSmokeCatalog}
            title="在控制台列出并于地图放置所有已配置的线烟技能 token"
          >
            线烟道具
          </button>
          <button
            type="button"
            className="map-debug-toolbar__btn map-debug-toolbar__btn--sphere"
            onClick={handleListSphereSmokeCatalog}
            title="在控制台列出并于地图放置所有已配置的球烟技能 token"
          >
            球烟道具
          </button>
          <button
            type="button"
            className="map-debug-toolbar__btn map-debug-toolbar__btn--danger"
            onClick={handleClearLocalStorage}
          >
            Clear LS
          </button>
        </div>
      ) : null}
      <AgentDetailDrawer />
      <AbilityDetailDrawer />
      {agentPopoverPlacement && abilityPopoverAnchor ? (
        <AgentAbilityPopover
          placement={agentPopoverPlacement}
          anchor={abilityPopoverAnchor}
          popoverRef={agentAbilityPopoverRef}
        />
      ) : null}
      {abilityInstancePopoverPlacement && abilityInstancePopoverAnchor ? (
        <AbilityInstanceActionPopover
          placement={abilityInstancePopoverPlacement}
          anchor={abilityInstancePopoverAnchor}
          popoverRef={abilityInstancePopoverRef}
        />
      ) : null}
      <TransformWrapper
        disabled={mapTransformLocked}
        initialScale={1}
        minScale={0.5}
        maxScale={2}
        centerOnInit
        limitToBounds
        smooth={false}
        wheel={{ step: 0.1 }}
        onTransform={handleMapTransform}
      >
        <TransformComponent
          wrapperStyle={{
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        >
          <div
            ref={stageWrapRef}
            className={defense ? 'map-stage-wrap map-stage-wrap--defense' : 'map-stage-wrap'}
            style={{ width: mapWidth, height: mapHeight }}
          >
            <Stage ref={stageRef} width={mapWidth} height={mapHeight}>
              <Layer>
                {valorantMap.walkableFloor.map((poly, idx) => (
                  <Shape
                    key={`floor-${idx}`}
                    sceneFunc={(ctx) => {
                      ctx.beginPath();
                      ctx.moveTo(poly[0].x, poly[0].y);
                      poly.forEach((p) => ctx.lineTo(p.x, p.y));
                      ctx.closePath();
                      ctx.fillStyle = 'rgba(13, 41, 59, 0.35)';
                      ctx.fill();
                    }}
                  />
                ))}
                {valorantMap.boxWalkable.map((poly, idx) => (
                  <Shape
                    key={`box-${idx}`}
                    sceneFunc={(ctx) => {
                      ctx.beginPath();
                      ctx.moveTo(poly[0].x, poly[0].y);
                      poly.forEach((p) => ctx.lineTo(p.x, p.y));
                      ctx.closePath();
                      ctx.fillStyle = 'rgba(13, 41, 59, 0.45)';
                      ctx.fill();
                      ctx.strokeStyle = 'rgba(28, 225, 207, 0.6)';
                      ctx.lineWidth = 1;
                      ctx.stroke();
                    }}
                  />
                ))}
              </Layer>

              <Layer>
                {valorantMap.areas.map((area) => (
                  <Shape
                    key={area.id}
                    sceneFunc={(ctx) => {
                      ctx.beginPath();
                      ctx.moveTo(area.polygon[0].x, area.polygon[0].y);
                      area.polygon.forEach((p) => ctx.lineTo(p.x, p.y));
                      ctx.closePath();
                      ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
                      ctx.fill();
                      ctx.strokeStyle = '#0ff';
                      ctx.stroke();
                    }}
                  />
                ))}
              </Layer>

              <Layer>
                {valorantMap.walls.map((wall) => (
                  <Line
                    key={wall.id}
                    points={[wall.line[0].x, wall.line[0].y, wall.line[1].x, wall.line[1].y]}
                    stroke="#fff"
                    strokeWidth={3}
                  />
                ))}
              </Layer>

              <Layer>
                {abilityPlacements.map((ab) => {
                  if (ab.directMovement) {
                    const movement = directMovementFromPlacement(ab);
                    if (
                      !movement ||
                      ab.activeAt == null ||
                      !timelineTimesEqualStep(ab.activeAt, timelineCurrentTime, timelineMaxTime)
                    ) {
                      return null;
                    }
                    const owner = mapPlacements.find((p) => p.id === ab.ownerPlacementId);
                    return (
                      <MapDirectMovement
                        key={`movement-direct-${ab.id}`}
                        startX={movement.startX}
                        startY={movement.startY}
                        endX={movement.endX}
                        endY={movement.endY}
                        side={owner?.side ?? 'attack'}
                        onCmdClick={(anchor) => {
                          closeAllMapPopovers();
                          openAbilityInstancePopover(ab.id, anchor);
                        }}
                      />
                    );
                  }
                  if (!isDeployedAbilityVisibleAtPlayhead(ab, timelineCurrentTime)) {
                    return null;
                  }
                  if (isSphericalSmokeAbility(ab.agentId, ab.abilitySlot)) {
                    const owner = mapPlacements.find((p) => p.id === ab.ownerPlacementId);
                    const side = owner?.side ?? 'attack';
                    const radius = getSphericalSmokeRadius(ab.agentId, ab.abilitySlot);
                    const variant = getSphericalSmokeVariant(ab.agentId, ab.abilitySlot);
                    return (
                      <MapSphericalSmoke
                        key={`smoke-sphere-${ab.id}`}
                        x={ab.x}
                        y={ab.y}
                        radius={radius}
                        side={side}
                        variant={variant}
                        onCmdClick={(anchor) => {
                          closeAllMapPopovers();
                          openAbilityInstancePopover(ab.id, anchor);
                        }}
                      />
                    );
                  }
                  if (isFixedDualLineSmokeAbility(ab.agentId, ab.abilitySlot)) {
                    const geom = lineSmokeFromPlacement(ab);
                    if (!geom) return null;
                    return (
                      <MapFixedDualLineSmoke
                        key={`smoke-line-${ab.id}`}
                        cx={geom.cx}
                        cy={geom.cy}
                        facing={geom.facing}
                        length={getFixedDualLineSmokeLength(ab.agentId, ab.abilitySlot)}
                        spacing={getFixedDualLineSmokeSpacing(ab.agentId, ab.abilitySlot)}
                        strokeWidth={getFixedDualLineSmokeStrokeWidth(ab.agentId, ab.abilitySlot)}
                        color={getFixedDualLineSmokeColor(ab.agentId, ab.abilitySlot)}
                        onCmdClick={(anchor) => {
                          closeAllMapPopovers();
                          openAbilityInstancePopover(ab.id, anchor);
                        }}
                      />
                    );
                  }
                  if (isFixedSingleLineSmokeAbility(ab.agentId, ab.abilitySlot)) {
                    const geom = lineSmokeFromPlacement(ab);
                    if (!geom) return null;
                    return (
                      <MapFixedSingleLineSmoke
                        key={`smoke-line-single-${ab.id}`}
                        cx={geom.cx}
                        cy={geom.cy}
                        facing={geom.facing}
                        length={getFixedSingleLineSmokeLength(ab.agentId, ab.abilitySlot)}
                        strokeWidth={getLineSmokeStrokeWidth(ab.agentId, ab.abilitySlot)}
                        color={getLineSmokeColor(ab.agentId, ab.abilitySlot)}
                        onCmdClick={(anchor) => {
                          closeAllMapPopovers();
                          openAbilityInstancePopover(ab.id, anchor);
                        }}
                      />
                    );
                  }
                  if (isDrawableCurveSmokeAbility(ab.agentId, ab.abilitySlot)) {
                    const curve = curveSmokeFromPlacement(ab);
                    if (!curve) return null;
                    return (
                      <MapCurveSmoke
                        key={`smoke-curve-${ab.id}`}
                        points={curve.points}
                        strokeWidth={getLineSmokeStrokeWidth(ab.agentId, ab.abilitySlot)}
                        color={getLineSmokeColor(ab.agentId, ab.abilitySlot)}
                        onCmdClick={(anchor) => {
                          closeAllMapPopovers();
                          openAbilityInstancePopover(ab.id, anchor);
                        }}
                      />
                    );
                  }
                  return null;
                })}
                {placingSphericalSmoke && sphericalSmokePreview ? (
                  <MapSphericalSmoke
                    x={sphericalSmokePreview.x}
                    y={sphericalSmokePreview.y}
                    radius={sphericalSmokeRadius}
                    side={sphericalSmokeSide}
                    variant={sphericalSmokeVariant}
                    preview
                  />
                ) : null}
                {placingFixedDualLineSmoke &&
                fixedDualLineSmokePreview &&
                fixedDualLineMeta ? (
                  <MapFixedDualLineSmoke
                    cx={fixedDualLineSmokePreview.cx}
                    cy={fixedDualLineSmokePreview.cy}
                    facing={fixedDualLineSmokePreview.facing}
                    length={fixedDualLineMeta.length}
                    spacing={fixedDualLineMeta.spacing}
                    strokeWidth={fixedDualLineMeta.strokeWidth}
                    color={fixedDualLineMeta.color}
                    preview
                  />
                ) : null}
                {placingFixedSingleLineSmoke &&
                fixedSingleLineSmokePreview &&
                fixedSingleLineMeta ? (
                  <MapFixedSingleLineSmoke
                    cx={fixedSingleLineSmokePreview.cx}
                    cy={fixedSingleLineSmokePreview.cy}
                    facing={fixedSingleLineSmokePreview.facing}
                    length={fixedSingleLineMeta.length}
                    strokeWidth={fixedSingleLineMeta.strokeWidth}
                    color={fixedSingleLineMeta.color}
                    preview
                  />
                ) : null}
                {placingCurveSmoke &&
                curveSmokePreviewPoints.length >= 2 &&
                curveSmokeMeta ? (
                  <MapCurveSmoke
                    points={curveSmokePreviewPoints}
                    strokeWidth={curveSmokeMeta.strokeWidth}
                    color={curveSmokeMeta.color}
                    preview
                  />
                ) : null}
                {placingDirectMovement && directMovementPreview ? (
                  <MapDirectMovement
                    startX={directMovementPreview.startX}
                    startY={directMovementPreview.startY}
                    endX={directMovementPreview.endX}
                    endY={directMovementPreview.endY}
                    side={directMovementSide}
                    preview
                  />
                ) : null}
                {anchorMovementPlacementDraft && anchorMovementOwner ? (
                  <>
                    <Circle
                      x={anchorMovementOwner.x}
                      y={anchorMovementOwner.y}
                      radius={anchorMovementPlacementDraft.range}
                      stroke="rgba(250, 204, 21, 0.72)"
                      strokeWidth={2}
                      dash={[8, 7]}
                      fill="rgba(250, 204, 21, 0.05)"
                      listening={false}
                    />
                    <Circle
                      x={anchorMovementPlacementDraft.previewX}
                      y={anchorMovementPlacementDraft.previewY}
                      radius={13}
                      stroke="rgba(250, 204, 21, 0.95)"
                      strokeWidth={2}
                      fill="rgba(15, 23, 42, 0.78)"
                      shadowColor="#facc15"
                      shadowBlur={14}
                      shadowOpacity={0.45}
                      listening={false}
                    />
                  </>
                ) : null}
                {placingBlastPack && blastPackPreview && blastPackOwner && blastPackPlacement ? (
                  <>
                    <Circle
                      x={blastPackOwner.x}
                      y={blastPackOwner.y}
                      radius={getMovementRange(blastPackPlacement.agentId, blastPackPlacement.abilitySlot)}
                      stroke="rgba(248, 113, 113, 0.72)"
                      strokeWidth={2}
                      dash={[7, 6]}
                      fill="rgba(248, 113, 113, 0.05)"
                      listening={false}
                    />
                    <Circle
                      x={blastPackPreview.x}
                      y={blastPackPreview.y}
                      radius={12}
                      stroke="rgba(248, 113, 113, 0.95)"
                      strokeWidth={2}
                      fill="rgba(15, 23, 42, 0.78)"
                      shadowColor="#f87171"
                      shadowBlur={14}
                      shadowOpacity={0.45}
                      listening={false}
                    />
                  </>
                ) : null}
              </Layer>

              <Layer>
                {abilityPlacements.map((ab) => (
                  <MapAbilityToken
                    key={ab.id}
                    placement={ab}
                    setMapTransformLocked={setMapTransformLocked}
                    isSelected={selectedAbilityPlacementId === ab.id}
                    onSelect={() => {
                      closeAllMapPopovers();
                      setSelectedAbilityPlacementId(ab.id);
                    }}
                  />
                ))}
              </Layer>

              <Layer>
                {mapPlacements.map((p) => (
                  <MapHeroToken
                    key={p.id}
                    placement={p}
                    setMapTransformLocked={setMapTransformLocked}
                    isSelected={selectedPlacementId === p.id}
                    onSelect={() => {
                      closeAllMapPopovers();
                      setSelectedPlacementId(p.id);
                    }}
                    onAbilityPopoverRequest={(anchor) => {
                      openAbilityPopover(p.id, anchor);
                    }}
                  />
                ))}
              </Layer>
            </Stage>
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};

export default Map;
