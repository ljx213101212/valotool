import { useMemo } from 'react';
import { Circle, Layer } from 'react-konva';
import { useMatchupStore } from '@/shared/store/useMatchupStore';
import { useTimelinePlaybackStore } from '@/shared/store/timelinePlaybackStore';
import {
  getSphericalSmokeRadius,
  getSphericalSmokeVariant,
  getFixedDualLineSmokeLength,
  getFixedDualLineSmokeSpacing,
  getFixedDualLineSmokeStrokeWidth,
  getFixedDualLineSmokeColor,
  getFixedSingleLineSmokeLength,
  getLineSmokeStrokeWidth,
  getLineSmokeColor,
  getMovementRange,
  getAbilityEffectLength,
  getAbilityEffectMeta,
  getAbilityEffectRadius,
  getAbilityEffectWidth,
  getAbilityStatusEffectType,
  isSphericalSmokeAbility,
  isFixedDualLineSmokeAbility,
  isFixedSingleLineSmokeAbility,
  isDrawableCurveSmokeAbility,
  isStatusEffectAbility,
} from '@/features/abilities/config';
import {
  directMovementFromPlacement,
  movementDisplacementsFromPlacement,
} from '@/shared/utils/directMovementGeometry';
import { timelineTimesEqualStep } from '@/shared/utils/timelineQuantize';
import { curveSmokeFromPlacement } from '@/shared/utils/curveSmokeGeometry';
import { lineSmokeFromPlacement } from '@/shared/utils/lineSmokeGeometry';
import { isDeployedAbilityVisibleAtPlayhead } from '@/shared/utils/timelineAbilityMutations';
import { MapDirectMovement } from './MapDirectMovement';
import { MapSphericalSmoke } from './MapSphericalSmoke';
import { MapFixedDualLineSmoke } from './MapFixedDualLineSmoke';
import { MapFixedSingleLineSmoke } from './MapFixedSingleLineSmoke';
import { MapCurveSmoke } from './MapCurveSmoke';
import { MapStatusEffect } from './MapStatusEffect';

type MapAbilityRenderLayerProps = {
  onCmdClick: (placementId: string, anchor: { clientX: number; clientY: number }) => void;
};

/**
 * MapAbilityRenderLayer renders all deployed ability effects and their placement previews
 * in a single Konva Layer.
 */
const MapAbilityRenderLayer = ({ onCmdClick }: MapAbilityRenderLayerProps) => {
  const mapPlacements = useMatchupStore((s) => s.mapPlacements);
  const abilityPlacements = useMatchupStore((s) => s.abilityPlacements);
  const timelineCurrentTime = useTimelinePlaybackStore((s) => s.currentTime);
  const timelineMaxTime = useTimelinePlaybackStore((s) => s.maxTime);

  // ---- preview state selectors ----
  const sphericalSmokePlacementId = useMatchupStore((s) => s.sphericalSmokePlacementId);
  const sphericalSmokePreview = useMatchupStore((s) => s.sphericalSmokePreview);
  const fixedDualLineSmokePlacementId = useMatchupStore((s) => s.fixedDualLineSmokePlacementId);
  const fixedDualLineSmokePreview = useMatchupStore((s) => s.fixedDualLineSmokePreview);
  const fixedSingleLineSmokePlacementId = useMatchupStore((s) => s.fixedSingleLineSmokePlacementId);
  const fixedSingleLineSmokePreview = useMatchupStore((s) => s.fixedSingleLineSmokePreview);
  const curveSmokePlacementId = useMatchupStore((s) => s.curveSmokePlacementId);
  const curveSmokePreviewPoints = useMatchupStore((s) => s.curveSmokePreviewPoints);
  const directMovementPlacementId = useMatchupStore((s) => s.directMovementPlacementId);
  const directMovementPreview = useMatchupStore((s) => s.directMovementPreview);
  const anchorMovementPlacementDraft = useMatchupStore((s) => s.anchorMovementPlacementDraft);
  const blastPackPlacementId = useMatchupStore((s) => s.blastPackPlacementId);
  const blastPackPlacementDraft = useMatchupStore((s) => s.blastPackPlacementDraft);
  const blastPackPreview = useMatchupStore((s) => s.blastPackPreview);
  const statusEffectPlacementId = useMatchupStore((s) => s.statusEffectPlacementId);
  const statusEffectPreview = useMatchupStore((s) => s.statusEffectPreview);

  // ----- placed effects -----
  const placingSphericalSmoke = !!sphericalSmokePlacementId && !!sphericalSmokePreview;
  const placingFixedDualLineSmoke = !!fixedDualLineSmokePlacementId && !!fixedDualLineSmokePreview;
  const placingFixedSingleLineSmoke =
    !!fixedSingleLineSmokePlacementId && !!fixedSingleLineSmokePreview;
  const placingCurveSmoke = !!curveSmokePlacementId;
  const placingDirectMovement = !!directMovementPlacementId && !!directMovementPreview;
  const placingBlastPack =
    !!blastPackPlacementDraft || (!!blastPackPlacementId && !!blastPackPreview);
  const placingStatusEffect = !!statusEffectPlacementId && !!statusEffectPreview;

  // ----- memos for smoke meta -----
  const sphericalSmokePlacement = useMemo(
    () =>
      sphericalSmokePlacementId
        ? abilityPlacements.find((p) => p.id === sphericalSmokePlacementId)
        : undefined,
    [abilityPlacements, sphericalSmokePlacementId],
  );

  const sphericalSmokeSide = useMemo(() => {
    if (!sphericalSmokePlacement) return 'attack' as const;
    const owner = mapPlacements.find(
      (p) => p.id === sphericalSmokePlacement.ownerPlacementId,
    );
    return owner?.side ?? 'attack';
  }, [mapPlacements, sphericalSmokePlacement]);

  const sphericalSmokeRadius = useMemo(() => {
    if (!sphericalSmokePlacement) return 55;
    return getSphericalSmokeRadius(
      sphericalSmokePlacement.agentId,
      sphericalSmokePlacement.abilitySlot,
    );
  }, [sphericalSmokePlacement]);

  const sphericalSmokeVariant = useMemo(() => {
    if (!sphericalSmokePlacement) return 'default' as const;
    return getSphericalSmokeVariant(
      sphericalSmokePlacement.agentId,
      sphericalSmokePlacement.abilitySlot,
    );
  }, [sphericalSmokePlacement]);

  const fixedDualLineSmokePlacement = useMemo(
    () =>
      fixedDualLineSmokePlacementId
        ? abilityPlacements.find((p) => p.id === fixedDualLineSmokePlacementId)
        : undefined,
    [abilityPlacements, fixedDualLineSmokePlacementId],
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
    [abilityPlacements, fixedSingleLineSmokePlacementId],
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
    [abilityPlacements, curveSmokePlacementId],
  );

  const curveSmokeMeta = useMemo(() => {
    if (!curveSmokePlacement) return null;
    const { agentId, abilitySlot } = curveSmokePlacement;
    return {
      strokeWidth: getLineSmokeStrokeWidth(agentId, abilitySlot),
      color: getLineSmokeColor(agentId, abilitySlot),
    };
  }, [curveSmokePlacement]);

  const directMovementPlacement = useMemo(
    () =>
      directMovementPlacementId
        ? abilityPlacements.find((p) => p.id === directMovementPlacementId)
        : undefined,
    [abilityPlacements, directMovementPlacementId],
  );

  const directMovementOwner = useMemo(() => {
    if (!directMovementPlacement) return undefined;
    return mapPlacements.find(
      (p) => p.id === directMovementPlacement.ownerPlacementId,
    );
  }, [directMovementPlacement, mapPlacements]);

  const directMovementSide = directMovementOwner?.side ?? 'attack';

  const anchorMovementOwner = useMemo(() => {
    if (!anchorMovementPlacementDraft) return undefined;
    return mapPlacements.find(
      (p) => p.id === anchorMovementPlacementDraft.ownerPlacementId,
    );
  }, [anchorMovementPlacementDraft, mapPlacements]);

  const blastPackPlacement = useMemo(
    () =>
      blastPackPlacementId
        ? abilityPlacements.find((p) => p.id === blastPackPlacementId)
        : undefined,
    [abilityPlacements, blastPackPlacementId],
  );

  const blastPackOwner = useMemo(() => {
    if (blastPackPlacementDraft) {
      return mapPlacements.find(
        (p) => p.id === blastPackPlacementDraft.ownerPlacementId,
      );
    }
    if (!blastPackPlacement) return undefined;
    return mapPlacements.find(
      (p) => p.id === blastPackPlacement.ownerPlacementId,
    );
  }, [blastPackPlacement, blastPackPlacementDraft, mapPlacements]);

  const blastPackPreviewPoint = blastPackPlacementDraft
    ? { x: blastPackPlacementDraft.previewX, y: blastPackPlacementDraft.previewY }
    : blastPackPreview;

  const blastPackPlacementRange =
    blastPackPlacementDraft?.range ??
    (blastPackPlacement
      ? getMovementRange(blastPackPlacement.agentId, blastPackPlacement.abilitySlot)
      : 0);

  const statusEffectPlacement = useMemo(
    () =>
      statusEffectPlacementId
        ? abilityPlacements.find((p) => p.id === statusEffectPlacementId)
        : undefined,
    [abilityPlacements, statusEffectPlacementId],
  );

  const statusEffectOwner = useMemo(() => {
    if (!statusEffectPlacement) return undefined;
    return mapPlacements.find((p) => p.id === statusEffectPlacement.ownerPlacementId);
  }, [mapPlacements, statusEffectPlacement]);

  const statusEffectPreviewMeta = useMemo(() => {
    if (!statusEffectPlacement) return null;
    const { agentId, abilitySlot } = statusEffectPlacement;
    const meta = getAbilityEffectMeta(agentId, abilitySlot);
    const lineLike =
      meta?.concussDelivery === 'line-zone' || meta?.flashDelivery === 'zone-projectile';
    return {
      kind: getAbilityStatusEffectType(agentId, abilitySlot),
      radius: getAbilityEffectRadius(agentId, abilitySlot),
      length: lineLike ? getAbilityEffectLength(agentId, abilitySlot) : undefined,
      width: getAbilityEffectWidth(agentId, abilitySlot),
    };
  }, [statusEffectPlacement]);

  return (
    <Layer>
      {/* ---- deployed ability effects ---- */}
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
          const displacements = movementDisplacementsFromPlacement(ab);
          return displacements.map((entry, index) => {
            const impacted = entry.placementId
              ? mapPlacements.find((p) => p.id === entry.placementId)
              : undefined;
            const owner = mapPlacements.find((p) => p.id === ab.ownerPlacementId);
            return (
              <MapDirectMovement
                key={`movement-direct-${ab.id}-${entry.placementId ?? index}`}
                startX={entry.startX}
                startY={entry.startY}
                endX={entry.endX}
                endY={entry.endY}
                side={impacted?.side ?? owner?.side ?? 'attack'}
                onCmdClick={(anchor) => onCmdClick(ab.id, anchor)}
              />
            );
          });
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
              onCmdClick={(anchor) => onCmdClick(ab.id, anchor)}
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
              onCmdClick={(anchor) => onCmdClick(ab.id, anchor)}
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
              onCmdClick={(anchor) => onCmdClick(ab.id, anchor)}
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
              onCmdClick={(anchor) => onCmdClick(ab.id, anchor)}
            />
          );
        }

        if (isStatusEffectAbility(ab.agentId, ab.abilitySlot) && ab.statusEffect) {
          return (
            <MapStatusEffect
              key={`status-effect-${ab.id}`}
              kind={ab.statusEffect.kind}
              sourceX={ab.statusEffect.sourceX}
              sourceY={ab.statusEffect.sourceY}
              radius={ab.statusEffect.radius}
              facing={ab.statusEffect.facing}
              length={ab.statusEffect.length}
              width={ab.statusEffect.width}
              onCmdClick={(anchor) => onCmdClick(ab.id, anchor)}
            />
          );
        }

        return null;
      })}

      {/* ---- placement previews ---- */}
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

      {placingFixedDualLineSmoke && fixedDualLineSmokePreview && fixedDualLineMeta ? (
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

      {placingFixedSingleLineSmoke && fixedSingleLineSmokePreview && fixedSingleLineMeta ? (
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

      {placingCurveSmoke && curveSmokePreviewPoints.length >= 2 && curveSmokeMeta ? (
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

      {placingBlastPack && blastPackPreviewPoint && blastPackOwner ? (
        <>
          <Circle
            x={blastPackOwner.x}
            y={blastPackOwner.y}
            radius={blastPackPlacementRange}
            stroke="rgba(248, 113, 113, 0.72)"
            strokeWidth={2}
            dash={[7, 6]}
            fill="rgba(248, 113, 113, 0.05)"
            listening={false}
          />
          <Circle
            x={blastPackPreviewPoint.x}
            y={blastPackPreviewPoint.y}
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

      {placingStatusEffect && statusEffectPreview && statusEffectPreviewMeta ? (
        <MapStatusEffect
          kind={statusEffectPreviewMeta.kind}
          sourceX={
            statusEffectPreviewMeta.length && statusEffectOwner
              ? statusEffectOwner.x
              : statusEffectPreview.x
          }
          sourceY={
            statusEffectPreviewMeta.length && statusEffectOwner
              ? statusEffectOwner.y
              : statusEffectPreview.y
          }
          radius={statusEffectPreviewMeta.radius}
          facing={statusEffectPreview.facing}
          length={statusEffectPreviewMeta.length}
          width={statusEffectPreviewMeta.width}
          preview
        />
      ) : null}
    </Layer>
  );
};

export default MapAbilityRenderLayer;
