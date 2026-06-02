import { useEffect, useRef } from 'react';
import type Konva from 'konva';
import { useMatchupStore } from '@/shared/store/useMatchupStore';
import { clientPointToMapStage } from '@/shared/utils/mapStagePointer';
import { appendCurvePoint, isValidCurveSmokePoints } from '@/shared/utils/curveSmokeGeometry';
import type { SyncPreviews } from './useMapPlacementPreviews';

/** Utility: lock map zoom/pan during placement so mouse moves don't scroll the viewport */
function lockMapTransformForPlacementEffect(
  setMapTransformLocked: (v: boolean) => void,
) {
  const timer = window.setTimeout(() => setMapTransformLocked(true), 0);
  return () => window.clearTimeout(timer);
}

// ---------------------------------------------------------------------------
// Placement effect hooks – one per ability placement mode
// ---------------------------------------------------------------------------

type UsePlacementEffectArgs = {
  stageRef: React.RefObject<Konva.Stage | null>;
  setMapTransformLocked: (v: boolean) => void;
};

export function useSphericalSmokePlacementEffect(
  args: UsePlacementEffectArgs & {
    placing: boolean;
    syncPreview: SyncPreviews['syncSphericalSmokePreview'];
    confirm: (x: number, y: number) => void;
  },
) {
  const { stageRef, setMapTransformLocked, placing, syncPreview, confirm } = args;

  useEffect(() => {
    if (!placing) return;
    const cancelLock = lockMapTransformForPlacementEffect(setMapTransformLocked);

    const onMove = (e: PointerEvent) => syncPreview(e.clientX, e.clientY);
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const stage = stageRef.current;
      if (!stage) return;
      if (!stage.container().contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      const pt = clientPointToMapStage(stage, e.clientX, e.clientY);
      if (!pt) return;
      confirm(pt.x, pt.y);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown, true);
      cancelLock();
      setMapTransformLocked(false);
    };
  }, [placing, stageRef, setMapTransformLocked, syncPreview, confirm]);
}

export function useFixedDualLineSmokePlacementEffect(
  args: UsePlacementEffectArgs & {
    placing: boolean;
    ownerPlacementId?: string;
    currentFacing?: number;
    syncPreview: SyncPreviews['syncFixedDualLinePreview'];
    confirm: (x: number, y: number, facing: number) => void;
  },
) {
  const { stageRef, setMapTransformLocked, placing, ownerPlacementId, currentFacing, syncPreview, confirm } =
    args;

  useEffect(() => {
    if (!placing) return;
    const cancelLock = lockMapTransformForPlacementEffect(setMapTransformLocked);

    const onMove = (e: PointerEvent) =>
      syncPreview(e.clientX, e.clientY, ownerPlacementId, currentFacing);
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const stage = stageRef.current;
      if (!stage) return;
      if (!stage.container().contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      const pt = clientPointToMapStage(stage, e.clientX, e.clientY);
      if (!pt) return;

      // Recalculate facing the same way the preview does
      const mapPlacements = useMatchupStore.getState().mapPlacements;
      const owner = ownerPlacementId
        ? mapPlacements.find((p) => p.id === ownerPlacementId)
        : undefined;
      const facing = owner
        ? Math.atan2(pt.y - owner.y, pt.x - owner.x)
        : (currentFacing ?? 0);
      confirm(pt.x, pt.y, facing);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown, true);
      cancelLock();
      setMapTransformLocked(false);
    };
  }, [placing, stageRef, setMapTransformLocked, ownerPlacementId, currentFacing, syncPreview, confirm]);
}

export function useFixedSingleLineSmokePlacementEffect(
  args: UsePlacementEffectArgs & {
    placing: boolean;
    ownerPlacementId?: string;
    currentFacing?: number;
    syncPreview: SyncPreviews['syncFixedSingleLinePreview'];
    confirm: (x: number, y: number, facing: number) => void;
  },
) {
  const { stageRef, setMapTransformLocked, placing, ownerPlacementId, currentFacing, syncPreview, confirm } =
    args;

  useEffect(() => {
    if (!placing) return;
    const cancelLock = lockMapTransformForPlacementEffect(setMapTransformLocked);

    const onMove = (e: PointerEvent) =>
      syncPreview(e.clientX, e.clientY, ownerPlacementId, currentFacing);
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const stage = stageRef.current;
      if (!stage) return;
      if (!stage.container().contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      const pt = clientPointToMapStage(stage, e.clientX, e.clientY);
      if (!pt) return;

      const mapPlacements = useMatchupStore.getState().mapPlacements;
      const owner = ownerPlacementId
        ? mapPlacements.find((p) => p.id === ownerPlacementId)
        : undefined;
      const facing = owner
        ? Math.atan2(pt.y - owner.y, pt.x - owner.x)
        : (currentFacing ?? 0);
      confirm(pt.x, pt.y, facing);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown, true);
      cancelLock();
      setMapTransformLocked(false);
    };
  }, [placing, stageRef, setMapTransformLocked, ownerPlacementId, currentFacing, syncPreview, confirm]);
}

export function useDirectMovementPlacementEffect(
  args: UsePlacementEffectArgs & {
    placing: boolean;
    syncPreview: SyncPreviews['syncDirectMovementPreview'];
    confirm: (x: number, y: number) => void;
  },
) {
  useSimplePlacementEffect(args);
}

export function useAnchorMovementPlacementEffect(
  args: UsePlacementEffectArgs & {
    placing: boolean;
    syncPreview: SyncPreviews['syncAnchorMovementPreview'];
    confirm: (x: number, y: number) => void;
  },
) {
  useSimplePlacementEffect(args);
}

export function useBlastPackPlacementEffect(
  args: UsePlacementEffectArgs & {
    placing: boolean;
    syncPreview: SyncPreviews['syncBlastPackPreview'];
    confirm: (x: number, y: number) => void;
  },
) {
  useSimplePlacementEffect(args);
}

export function useStatusEffectPlacementEffect(
  args: UsePlacementEffectArgs & {
    placing: boolean;
    syncPreview: SyncPreviews['syncStatusEffectPreview'];
    confirm: (x: number, y: number) => void;
  },
) {
  useSimplePlacementEffect(args);
}

/** Shared implementation for simple "move-to-preview + click-to-confirm" placements */
function useSimplePlacementEffect(
  args: UsePlacementEffectArgs & {
    placing: boolean;
    syncPreview: (clientX: number, clientY: number) => void;
    confirm: (x: number, y: number) => void;
  },
) {
  const { stageRef, setMapTransformLocked, placing, syncPreview, confirm } = args;

  useEffect(() => {
    if (!placing) return;
    const cancelLock = lockMapTransformForPlacementEffect(setMapTransformLocked);

    const onMove = (e: PointerEvent) => syncPreview(e.clientX, e.clientY);
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const stage = stageRef.current;
      if (!stage) return;
      if (!stage.container().contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      const pt = clientPointToMapStage(stage, e.clientX, e.clientY);
      if (!pt) return;
      confirm(pt.x, pt.y);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown, true);
      cancelLock();
      setMapTransformLocked(false);
    };
  }, [placing, stageRef, setMapTransformLocked, syncPreview, confirm]);
}

// ---------------------------------------------------------------------------
// Curve smoke – different interaction: mousedown to start, drag to draw, up to finish
// ---------------------------------------------------------------------------

export function useCurveSmokePlacementEffect(
  args: UsePlacementEffectArgs & {
    placing: boolean;
    maxLength: number;
    setPreviewPoints: (pts: number[]) => void;
    confirm: (points: number[]) => void;
  },
) {
  const { stageRef, setMapTransformLocked, placing, maxLength, setPreviewPoints, confirm } = args;
  const drawingRef = useRef(false);

  useEffect(() => {
    if (!placing) return;
    const cancelLock = lockMapTransformForPlacementEffect(setMapTransformLocked);
    drawingRef.current = false;

    const stagePoint = (clientX: number, clientY: number) => {
      const stage = stageRef.current;
      if (!stage) return null;
      return clientPointToMapStage(stage, clientX, clientY);
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const stage = stageRef.current;
      if (!stage) return;
      if (!stage.container().contains(e.target as Node)) return;
      e.preventDefault();
      e.stopPropagation();
      const pt = stagePoint(e.clientX, e.clientY);
      if (!pt) return;
      drawingRef.current = true;
      setPreviewPoints([pt.x, pt.y]);
    };

    const onMove = (e: PointerEvent) => {
      if (!drawingRef.current || (e.buttons & 1) === 0) return;
      const pt = stagePoint(e.clientX, e.clientY);
      if (!pt) return;
      const prev = useMatchupStore.getState().curveSmokePreviewPoints;
      setPreviewPoints(appendCurvePoint(prev, pt.x, pt.y, maxLength));
    };

    const onUp = () => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      const points = useMatchupStore.getState().curveSmokePreviewPoints;
      if (isValidCurveSmokePoints(points)) {
        confirm(points);
      } else {
        setPreviewPoints([]);
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
      drawingRef.current = false;
      cancelLock();
      setMapTransformLocked(false);
    };
  }, [placing, stageRef, setMapTransformLocked, maxLength, setPreviewPoints, confirm]);
}
