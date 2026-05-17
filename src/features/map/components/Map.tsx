import { useDroppable } from '@dnd-kit/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { valorantMap } from '@/shared/data/valorantMap';
import { MAP_DROP_ZONE_ID } from '@/shared/constants/dnd';
import { useMapSelectionStore } from '@/shared/store/useMapSelectionStore';
import { Layer, Line, Shape, Stage } from 'react-konva';
import { AbilityDetailDrawer } from '@/features/abilities/components/AbilityDetailDrawer';
import { AgentAbilityPopover } from '@/features/agents/components/AgentAbilityPopover';
import { AbilityInstanceActionPopover } from '@/features/map/components/AbilityInstanceActionPopover';
import { AgentDetailDrawer } from '@/features/agents/components/AgentDetailDrawer';
import { useMatchupStore } from '@/shared/store/useMatchupStore';
import { MapAbilityToken } from './MapAbilityToken';
import { MapHeroToken } from './MapHeroToken';
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
  const closeAbilityInstancePopover = useMatchupStore((s) => s.closeAbilityInstancePopover);
  const mapWidth = valorantMap.bounds.max.x - valorantMap.bounds.min.x + 100;
  const mapHeight = valorantMap.bounds.max.y - valorantMap.bounds.min.y + 100;
  const defense = side === 'defense';
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const agentAbilityPopoverRef = useRef<HTMLDivElement>(null);
  const abilityInstancePopoverRef = useRef<HTMLDivElement>(null);
  const [mapTransformLocked, setMapTransformLocked] = useState(false);

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
    if (!abilityPopoverPlacementId && !abilityInstancePopoverId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAllMapPopovers();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [abilityPopoverPlacementId, abilityInstancePopoverId, closeAllMapPopovers]);

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
      {abilityInstancePopoverPlacement &&
      abilityInstancePopoverAnchor &&
      abilityInstancePopoverPlacement.state === 'initial' ? (
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
            <Stage width={mapWidth} height={mapHeight}>
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
