import { useCallback } from 'react';
import type Konva from 'konva';
import { useMatchupStore } from '@/shared/store/useMatchupStore';
import { clientPointToMapStage } from '@/shared/utils/mapStagePointer';

export type SyncPreviews = ReturnType<typeof useMapPlacementPreviews>;

/**
 * Returns callbacks that sync mouse position on screen → map-stage coordinates
 * for each kind of ability placement preview.
 */
export function useMapPlacementPreviews(stageRef: React.RefObject<Konva.Stage | null>) {
  const mapPlacements = useMatchupStore((s) => s.mapPlacements);
  const updateSphericalSmokePreview = useMatchupStore((s) => s.updateSphericalSmokePreview);
  const updateFixedDualLineSmokePreview = useMatchupStore(
    (s) => s.updateFixedDualLineSmokePreview,
  );
  const updateFixedSingleLineSmokePreview = useMatchupStore(
    (s) => s.updateFixedSingleLineSmokePreview,
  );
  const updateDirectMovementPreview = useMatchupStore((s) => s.updateDirectMovementPreview);
  const updateAnchorMovementPlacementPreview = useMatchupStore(
    (s) => s.updateAnchorMovementPlacementPreview,
  );
  const updateBlastPackPreview = useMatchupStore((s) => s.updateBlastPackPreview);
  const updateStatusEffectPreview = useMatchupStore((s) => s.updateStatusEffectPreview);

  const stagePoint = useCallback(
    (clientX: number, clientY: number) => {
      const stage = stageRef.current;
      if (!stage) return null;
      return clientPointToMapStage(stage, clientX, clientY);
    },
    [stageRef],
  );

  const syncSphericalSmokePreview = useCallback(
    (clientX: number, clientY: number) => {
      const pt = stagePoint(clientX, clientY);
      if (!pt) return;
      updateSphericalSmokePreview(pt.x, pt.y);
    },
    [stagePoint, updateSphericalSmokePreview],
  );

  const syncFixedDualLinePreview = useCallback(
    (clientX: number, clientY: number, ownerPlacementId?: string, currentFacing?: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const pt = clientPointToMapStage(stage, clientX, clientY);
      if (!pt) return;
      const owner = ownerPlacementId
        ? mapPlacements.find((p) => p.id === ownerPlacementId)
        : undefined;
      const facing = owner
        ? Math.atan2(pt.y - owner.y, pt.x - owner.x)
        : (currentFacing ?? 0);
      updateFixedDualLineSmokePreview(pt.x, pt.y, facing);
    },
    [stageRef, mapPlacements, updateFixedDualLineSmokePreview],
  );

  const syncFixedSingleLinePreview = useCallback(
    (clientX: number, clientY: number, ownerPlacementId?: string, currentFacing?: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const pt = clientPointToMapStage(stage, clientX, clientY);
      if (!pt) return;
      const owner = ownerPlacementId
        ? mapPlacements.find((p) => p.id === ownerPlacementId)
        : undefined;
      const facing = owner
        ? Math.atan2(pt.y - owner.y, pt.x - owner.x)
        : (currentFacing ?? 0);
      updateFixedSingleLineSmokePreview(pt.x, pt.y, facing);
    },
    [stageRef, mapPlacements, updateFixedSingleLineSmokePreview],
  );

  const syncDirectMovementPreview = useCallback(
    (clientX: number, clientY: number) => {
      const pt = stagePoint(clientX, clientY);
      if (!pt) return;
      updateDirectMovementPreview(pt.x, pt.y);
    },
    [stagePoint, updateDirectMovementPreview],
  );

  const syncAnchorMovementPreview = useCallback(
    (clientX: number, clientY: number) => {
      const pt = stagePoint(clientX, clientY);
      if (!pt) return;
      updateAnchorMovementPlacementPreview(pt.x, pt.y);
    },
    [stagePoint, updateAnchorMovementPlacementPreview],
  );

  const syncBlastPackPreview = useCallback(
    (clientX: number, clientY: number) => {
      const pt = stagePoint(clientX, clientY);
      if (!pt) return;
      updateBlastPackPreview(pt.x, pt.y);
    },
    [stagePoint, updateBlastPackPreview],
  );

  const syncStatusEffectPreview = useCallback(
    (clientX: number, clientY: number) => {
      const pt = stagePoint(clientX, clientY);
      if (!pt) return;
      updateStatusEffectPreview(pt.x, pt.y);
    },
    [stagePoint, updateStatusEffectPreview],
  );

  return {
    syncSphericalSmokePreview,
    syncFixedDualLinePreview,
    syncFixedSingleLinePreview,
    syncDirectMovementPreview,
    syncAnchorMovementPreview,
    syncBlastPackPreview,
    syncStatusEffectPreview,
  } as const;
}
