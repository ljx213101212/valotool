import { useDroppable } from '@dnd-kit/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import type Konva from 'konva';
import { valorantMap } from '@/shared/data/valorantMap';
import { MAP_DROP_ZONE_ID } from '@/shared/constants/dnd';
import { useMapSelectionStore } from '@/shared/store/useMapSelectionStore';
import { Layer, Stage } from 'react-konva';
import {
  getDrawableCurveMaxLength,
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
import { MapAbilityToken } from './MapAbilityToken';
import { MapHeroToken } from './MapHeroToken';
import MapBackgroundLayers from './MapBackgroundLayers';
import MapAbilityRenderLayer from './MapAbilityRenderLayer';
import { useMapPlacementPreviews } from '../hooks/useMapPlacementPreviews';
import {
  useSphericalSmokePlacementEffect,
  useFixedDualLineSmokePlacementEffect,
  useFixedSingleLineSmokePlacementEffect,
  useCurveSmokePlacementEffect,
  useDirectMovementPlacementEffect,
  useAnchorMovementPlacementEffect,
  useBlastPackPlacementEffect,
  useStatusEffectPlacementEffect,
} from '../hooks/useMapPlacementEffects';
import './Map.less';

const Map = () => {
  // ------------------------------------------------------------------
  // store selectors
  // ------------------------------------------------------------------
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
  const cancelSphericalSmokePlacement = useMatchupStore((s) => s.cancelSphericalSmokePlacement);
  const confirmSphericalSmokePlacement = useMatchupStore((s) => s.confirmSphericalSmokePlacement);

  const fixedDualLineSmokePlacementId = useMatchupStore(
    (s) => s.fixedDualLineSmokePlacementId,
  );
  const fixedDualLineSmokePreview = useMatchupStore((s) => s.fixedDualLineSmokePreview);
  const cancelFixedDualLineSmokePlacement = useMatchupStore(
    (s) => s.cancelFixedDualLineSmokePlacement,
  );
  const confirmFixedDualLineSmokePlacement = useMatchupStore(
    (s) => s.confirmFixedDualLineSmokePlacement,
  );

  const fixedSingleLineSmokePlacementId = useMatchupStore(
    (s) => s.fixedSingleLineSmokePlacementId,
  );
  const fixedSingleLineSmokePreview = useMatchupStore((s) => s.fixedSingleLineSmokePreview);
  const cancelFixedSingleLineSmokePlacement = useMatchupStore(
    (s) => s.cancelFixedSingleLineSmokePlacement,
  );
  const confirmFixedSingleLineSmokePlacement = useMatchupStore(
    (s) => s.confirmFixedSingleLineSmokePlacement,
  );

  const curveSmokePlacementId = useMatchupStore((s) => s.curveSmokePlacementId);
  const cancelCurveSmokePlacement = useMatchupStore((s) => s.cancelCurveSmokePlacement);
  const confirmCurveSmokePlacement = useMatchupStore((s) => s.confirmCurveSmokePlacement);
  const setCurveSmokePreviewPoints = useMatchupStore((s) => s.setCurveSmokePreviewPoints);

  const directMovementPlacementId = useMatchupStore((s) => s.directMovementPlacementId);
  const directMovementPreview = useMatchupStore((s) => s.directMovementPreview);
  const cancelDirectMovementPlacement = useMatchupStore((s) => s.cancelDirectMovementPlacement);
  const confirmDirectMovementPlacement = useMatchupStore((s) => s.confirmDirectMovementPlacement);

  const anchorMovementPlacementDraft = useMatchupStore((s) => s.anchorMovementPlacementDraft);
  const cancelAnchorMovementPlacement = useMatchupStore((s) => s.cancelAnchorMovementPlacement);
  const confirmAnchorMovementPlacement = useMatchupStore((s) => s.confirmAnchorMovementPlacement);

  const blastPackPlacementId = useMatchupStore((s) => s.blastPackPlacementId);
  const blastPackPreview = useMatchupStore((s) => s.blastPackPreview);
  const blastPackPlacementDraft = useMatchupStore((s) => s.blastPackPlacementDraft);
  const cancelBlastPackPlacement = useMatchupStore((s) => s.cancelBlastPackPlacement);
  const confirmBlastPackPlacement = useMatchupStore((s) => s.confirmBlastPackPlacement);

  const statusEffectPlacementId = useMatchupStore((s) => s.statusEffectPlacementId);
  const statusEffectPreview = useMatchupStore((s) => s.statusEffectPreview);
  const cancelStatusEffectPlacement = useMatchupStore((s) => s.cancelStatusEffectPlacement);
  const confirmStatusEffectPlacement = useMatchupStore((s) => s.confirmStatusEffectPlacement);

  const spawnAbilityPlacement = useMatchupStore((s) => s.spawnAbilityPlacement);

  // ------------------------------------------------------------------
  // derived booleans
  // ------------------------------------------------------------------
  const placingSphericalSmoke = !!sphericalSmokePlacementId && !!sphericalSmokePreview;
  const placingFixedDualLineSmoke =
    !!fixedDualLineSmokePlacementId && !!fixedDualLineSmokePreview;
  const placingFixedSingleLineSmoke =
    !!fixedSingleLineSmokePlacementId && !!fixedSingleLineSmokePreview;
  const placingCurveSmoke = !!curveSmokePlacementId;
  const placingDirectMovement = !!directMovementPlacementId && !!directMovementPreview;
  const placingAnchorMovement = !!anchorMovementPlacementDraft;
  const placingBlastPack =
    !!blastPackPlacementDraft || (!!blastPackPlacementId && !!blastPackPreview);
  const placingStatusEffect = !!statusEffectPlacementId && !!statusEffectPreview;

  const placingSmoke =
    placingSphericalSmoke ||
    placingFixedDualLineSmoke ||
    placingFixedSingleLineSmoke ||
    placingCurveSmoke;
  const placingAbilityEffect =
    placingSmoke ||
    placingDirectMovement ||
    placingAnchorMovement ||
    placingBlastPack ||
    placingStatusEffect;

  // ------------------------------------------------------------------
  // memoized meta for placement effect hooks
  // ------------------------------------------------------------------
  const fixedDualLineSmokePlacement = useMemo(
    () =>
      fixedDualLineSmokePlacementId
        ? abilityPlacements.find((p) => p.id === fixedDualLineSmokePlacementId)
        : undefined,
    [abilityPlacements, fixedDualLineSmokePlacementId],
  );

  const fixedSingleLineSmokePlacement = useMemo(
    () =>
      fixedSingleLineSmokePlacementId
        ? abilityPlacements.find((p) => p.id === fixedSingleLineSmokePlacementId)
        : undefined,
    [abilityPlacements, fixedSingleLineSmokePlacementId],
  );

  const curveSmokePlacement = useMemo(
    () =>
      curveSmokePlacementId
        ? abilityPlacements.find((p) => p.id === curveSmokePlacementId)
        : undefined,
    [abilityPlacements, curveSmokePlacementId],
  );

  const curveSmokeMaxLength = useMemo(() => {
    if (!curveSmokePlacement) return smokeMapUnitsFromMeters(18);
    return getDrawableCurveMaxLength(
      curveSmokePlacement.agentId,
      curveSmokePlacement.abilitySlot,
    );
  }, [curveSmokePlacement]);

  // ------------------------------------------------------------------
  // refs & local state
  // ------------------------------------------------------------------
  const stageRef = useRef<Konva.Stage | null>(null);
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const agentAbilityPopoverRef = useRef<HTMLDivElement>(null);
  const abilityInstancePopoverRef = useRef<HTMLDivElement>(null);
  const [mapTransformLocked, setMapTransformLocked] = useState(false);

  const mapWidth = valorantMap.bounds.max.x - valorantMap.bounds.min.x + 100;
  const mapHeight = valorantMap.bounds.max.y - valorantMap.bounds.min.y + 100;
  const defense = side === 'defense';

  // ------------------------------------------------------------------
  // droppable zone
  // ------------------------------------------------------------------
  const { setNodeRef, isOver } = useDroppable({ id: MAP_DROP_ZONE_ID });

  // ------------------------------------------------------------------
  // popover state
  // ------------------------------------------------------------------
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

  const handleAbilityInstancePopover = useCallback(
    (placementId: string, anchor: { clientX: number; clientY: number }) => {
      closeAllMapPopovers();
      openAbilityInstancePopover(placementId, anchor);
    },
    [closeAllMapPopovers, openAbilityInstancePopover],
  );

  // ------------------------------------------------------------------
  // preview sync hooks
  // ------------------------------------------------------------------
  const previews = useMapPlacementPreviews(stageRef);

  // ------------------------------------------------------------------
  // placement effect hooks — delegating all pointer interaction per mode
  // ------------------------------------------------------------------
  useSphericalSmokePlacementEffect({
    stageRef,
    setMapTransformLocked,
    placing: placingSphericalSmoke,
    syncPreview: previews.syncSphericalSmokePreview,
    confirm: confirmSphericalSmokePlacement,
  });

  useFixedDualLineSmokePlacementEffect({
    stageRef,
    setMapTransformLocked,
    placing: placingFixedDualLineSmoke,
    ownerPlacementId: fixedDualLineSmokePlacement?.ownerPlacementId,
    currentFacing: fixedDualLineSmokePreview?.facing,
    syncPreview: previews.syncFixedDualLinePreview,
    confirm: confirmFixedDualLineSmokePlacement,
  });

  useFixedSingleLineSmokePlacementEffect({
    stageRef,
    setMapTransformLocked,
    placing: placingFixedSingleLineSmoke,
    ownerPlacementId: fixedSingleLineSmokePlacement?.ownerPlacementId,
    currentFacing: fixedSingleLineSmokePreview?.facing,
    syncPreview: previews.syncFixedSingleLinePreview,
    confirm: confirmFixedSingleLineSmokePlacement,
  });

  useDirectMovementPlacementEffect({
    stageRef,
    setMapTransformLocked,
    placing: placingDirectMovement,
    syncPreview: previews.syncDirectMovementPreview,
    confirm: confirmDirectMovementPlacement,
  });

  useAnchorMovementPlacementEffect({
    stageRef,
    setMapTransformLocked,
    placing: placingAnchorMovement,
    syncPreview: previews.syncAnchorMovementPreview,
    confirm: confirmAnchorMovementPlacement,
  });

  useBlastPackPlacementEffect({
    stageRef,
    setMapTransformLocked,
    placing: placingBlastPack,
    syncPreview: previews.syncBlastPackPreview,
    confirm: confirmBlastPackPlacement,
  });

  useStatusEffectPlacementEffect({
    stageRef,
    setMapTransformLocked,
    placing: placingStatusEffect,
    syncPreview: previews.syncStatusEffectPreview,
    confirm: confirmStatusEffectPlacement,
  });

  useCurveSmokePlacementEffect({
    stageRef,
    setMapTransformLocked,
    placing: placingCurveSmoke,
    maxLength: curveSmokeMaxLength,
    setPreviewPoints: setCurveSmokePreviewPoints,
    confirm: confirmCurveSmokePlacement,
  });

  // ------------------------------------------------------------------
  // cleanup effects
  // ------------------------------------------------------------------

  // close popovers on outside click
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

  // Escape key
  useEffect(() => {
    if (!abilityPopoverPlacementId && !abilityInstancePopoverId && !placingAbilityEffect) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (placingSphericalSmoke) return cancelSphericalSmokePlacement();
      if (placingFixedDualLineSmoke) return cancelFixedDualLineSmokePlacement();
      if (placingFixedSingleLineSmoke) return cancelFixedSingleLineSmokePlacement();
      if (placingCurveSmoke) return cancelCurveSmokePlacement();
      if (placingDirectMovement) return cancelDirectMovementPlacement();
      if (placingAnchorMovement) return cancelAnchorMovementPlacement();
      if (placingBlastPack) return cancelBlastPackPlacement();
      if (placingStatusEffect) return cancelStatusEffectPlacement();
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
    placingStatusEffect,
    cancelSphericalSmokePlacement,
    cancelFixedDualLineSmokePlacement,
    cancelFixedSingleLineSmokePlacement,
    cancelCurveSmokePlacement,
    cancelDirectMovementPlacement,
    cancelAnchorMovementPlacement,
    cancelBlastPackPlacement,
    cancelStatusEffectPlacement,
    closeAllMapPopovers,
  ]);

  // close popover when agent is eliminated
  useEffect(() => {
    if (!abilityPopoverPlacementId) return;
    const stillThere = mapPlacements.some(
      (p) => p.id === abilityPopoverPlacementId && !p.eliminated,
    );
    if (!stillThere) closeAbilityPopover();
  }, [abilityPopoverPlacementId, mapPlacements, closeAbilityPopover]);

  // clean up placement modes if the ability placement is deleted
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
    if (!statusEffectPlacementId) return;
    if (!abilityPlacements.some((p) => p.id === statusEffectPlacementId)) {
      cancelStatusEffectPlacement();
    }
  }, [statusEffectPlacementId, abilityPlacements, cancelStatusEffectPlacement]);

  // crosshair cursor while placing
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

  // release transform lock on pointer up / blur
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

  // close popovers on map transform
  const handleMapTransform = useCallback(() => {
    closeAllMapPopovers();
  }, [closeAllMapPopovers]);

  // ------------------------------------------------------------------
  // debug toolbar
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // render
  // ------------------------------------------------------------------
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
              <MapBackgroundLayers />
              <MapAbilityRenderLayer onCmdClick={handleAbilityInstancePopover} />
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
