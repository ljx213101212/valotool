import { useDroppable } from '@dnd-kit/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import type Konva from 'konva';
import { valorantMap } from '@/shared/data/valorantMap';
import { MAP_DROP_ZONE_ID } from '@/shared/constants/dnd';
import { useMapSelectionStore } from '@/shared/store/useMapSelectionStore';
import { Layer, Line, Shape, Stage } from 'react-konva';
import {
  getFixedDualLineSmokeColor,
  getFixedDualLineSmokeLength,
  getFixedDualLineSmokeSpacing,
  getFixedDualLineSmokeStrokeWidth,
  getSphericalSmokeRadius,
  isFixedDualLineSmokeAbility,
  isSphericalSmokeAbility,
} from '@/features/abilities/config';
import { AbilityDetailDrawer } from '@/features/abilities/components/AbilityDetailDrawer';
import { AgentAbilityPopover } from '@/features/agents/components/AgentAbilityPopover';
import { AbilityInstanceActionPopover } from '@/features/map/components/AbilityInstanceActionPopover';
import { AgentDetailDrawer } from '@/features/agents/components/AgentDetailDrawer';
import { useMatchupStore } from '@/shared/store/useMatchupStore';
import { useTimelinePlaybackStore } from '@/shared/store/timelinePlaybackStore';
import { isDeployedSmokeVisibleAtPlayhead } from '@/shared/utils/timelineAbilityMutations';
import { clientPointToMapStage } from '@/shared/utils/mapStagePointer';
import { lineSmokeFromPlacement } from '@/shared/utils/lineSmokeGeometry';
import { MapAbilityToken } from './MapAbilityToken';
import { MapFixedDualLineSmoke } from './MapFixedDualLineSmoke';
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
  const timelineCurrentTime = useTimelinePlaybackStore((s) => s.currentTime);
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
  const placingSmoke = placingSphericalSmoke || placingFixedDualLineSmoke;

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
    if (!abilityPopoverPlacementId && !abilityInstancePopoverId && !placingSmoke) return;
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
      closeAllMapPopovers();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    abilityPopoverPlacementId,
    abilityInstancePopoverId,
    placingSmoke,
    placingSphericalSmoke,
    placingFixedDualLineSmoke,
    cancelSphericalSmokePlacement,
    cancelFixedDualLineSmokePlacement,
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

  useEffect(() => {
    if (!placingSphericalSmoke) return;
    setMapTransformLocked(true);
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
      setMapTransformLocked(false);
    };
  }, [
    placingSphericalSmoke,
    syncSphericalSmokePreviewFromClient,
    confirmSphericalSmokePlacement,
  ]);

  useEffect(() => {
    if (!placingFixedDualLineSmoke) return;
    setMapTransformLocked(true);
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
      setMapTransformLocked(false);
    };
  }, [
    placingFixedDualLineSmoke,
    fixedDualLineSmokePlacement,
    fixedDualLineSmokePreview?.facing,
    mapPlacements,
    syncFixedDualLinePreviewFromClient,
    confirmFixedDualLineSmokePlacement,
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
    if (!placingSmoke) return;
    const stage = stageRef.current;
    const el = stage?.container();
    if (!el) return;
    const prev = el.style.cursor;
    el.style.cursor = 'crosshair';
    return () => {
      el.style.cursor = prev;
    };
  }, [placingSmoke]);

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

  return (
    <div
      ref={setNodeRef}
      className={`map-root${isOver ? ' map-root--drop-over' : ''}`}
    >
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
                  if (!isDeployedSmokeVisibleAtPlayhead(ab, timelineCurrentTime)) {
                    return null;
                  }
                  if (isSphericalSmokeAbility(ab.agentId, ab.abilitySlot)) {
                    const owner = mapPlacements.find((p) => p.id === ab.ownerPlacementId);
                    const side = owner?.side ?? 'attack';
                    const radius = getSphericalSmokeRadius(ab.agentId, ab.abilitySlot);
                    return (
                      <MapSphericalSmoke
                        key={`smoke-sphere-${ab.id}`}
                        x={ab.x}
                        y={ab.y}
                        radius={radius}
                        side={side}
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
                  return null;
                })}
                {placingSphericalSmoke && sphericalSmokePreview ? (
                  <MapSphericalSmoke
                    x={sphericalSmokePreview.x}
                    y={sphericalSmokePreview.y}
                    radius={sphericalSmokeRadius}
                    side={sphericalSmokeSide}
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
