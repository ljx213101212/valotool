import type {
  AbilityAffectsRule,
  AbilityStatusEffectType,
} from '@/features/abilities/config';
import type {
  AbilityAffectedStatus,
  AbilityStatusSeverity,
} from '@/shared/types/abilityStatus';
import type { Wall } from '@/shared/types/map';
import type { MapAgentPlacement } from '@/shared/types/matchup';
import { isLineOfSightBlocked } from './mapGeometry';

export type MapPoint = {
  x: number;
  y: number;
};

export type FlashExposureInput = {
  source: MapPoint;
  target: MapAgentPlacement;
  radius: number;
};

const FRONT_FLASH_DEG = 45;
const SIDE_FLASH_DEG = 135;

function distance(a: MapPoint, b: MapPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalizeRadians(value: number): number {
  let out = value;
  while (out <= -Math.PI) out += Math.PI * 2;
  while (out > Math.PI) out -= Math.PI * 2;
  return out;
}

function toDegrees(value: number): number {
  return (value * 180) / Math.PI;
}

export function statusStrengthForSeverity(severity: AbilityStatusSeverity): number {
  switch (severity) {
    case 'front':
      return 0.9;
    case 'side':
      return 0.55;
    case 'back':
      return 0.22;
    case 'miss':
      return 0;
  }
}

export function severityDurationMultiplier(severity: AbilityStatusSeverity): number {
  switch (severity) {
    case 'front':
      return 1;
    case 'side':
      return 0.6;
    case 'back':
      return 0.25;
    case 'miss':
      return 0;
  }
}

export function computeFlashExposure(input: FlashExposureInput): {
  severity: AbilityStatusSeverity;
  strength: number;
  distance: number;
  facingDeltaDeg: number;
} {
  const dist = distance(input.source, input.target);
  if (dist > input.radius) {
    return {
      severity: 'miss',
      strength: 0,
      distance: dist,
      facingDeltaDeg: 180,
    };
  }

  const angleToSource = Math.atan2(
    input.source.y - input.target.y,
    input.source.x - input.target.x,
  );
  const facingDeltaDeg = Math.abs(toDegrees(normalizeRadians(angleToSource - input.target.facing)));
  const severity =
    facingDeltaDeg <= FRONT_FLASH_DEG
      ? 'front'
      : facingDeltaDeg <= SIDE_FLASH_DEG
        ? 'side'
        : 'back';

  return {
    severity,
    strength: statusStrengthForSeverity(severity),
    distance: dist,
    facingDeltaDeg,
  };
}

function canAffectTarget(
  casterSide: MapAgentPlacement['side'],
  target: MapAgentPlacement,
  affects: AbilityAffectsRule,
): boolean {
  return affects === 'all-players' || target.side !== casterSide;
}

export function computeFlashTargets(input: {
  source: MapPoint;
  casterSide: MapAgentPlacement['side'];
  affects: AbilityAffectsRule;
  radius: number;
  targets: MapAgentPlacement[];
  startsAt: number;
  durationSec: number;
  fadeSec: number;
  effect: Exclude<AbilityStatusEffectType, 'concuss'>;
  walls?: Wall[];
}): AbilityAffectedStatus[] {
  return input.targets.flatMap((target) => {
    if (!canAffectTarget(input.casterSide, target, input.affects) || target.eliminated) return [];
    const exposure = computeFlashExposure({
      source: input.source,
      target,
      radius: input.radius,
    });
    if (exposure.severity === 'miss') return [];
    if (
      input.walls?.length &&
      isLineOfSightBlocked({
        source: input.source,
        target,
        walls: input.walls,
      }).blocked
    ) {
      return [];
    }
    const duration = input.durationSec * severityDurationMultiplier(exposure.severity);
    const endsAt = input.startsAt + duration;
    return [
      {
        targetPlacementId: target.id,
        effect: input.effect,
        severity: exposure.severity,
        strength: exposure.strength,
        startsAt: input.startsAt,
        endsAt,
        fadeEndsAt: endsAt + input.fadeSec,
      },
    ];
  });
}

export function computeCircularConcussTargets(input: {
  source: MapPoint;
  casterSide: MapAgentPlacement['side'];
  affects: AbilityAffectsRule;
  radius: number;
  targets: MapAgentPlacement[];
  startsAt: number;
  durationSec: number;
  fadeSec: number;
}): AbilityAffectedStatus[] {
  return input.targets.flatMap((target) => {
    if (!canAffectTarget(input.casterSide, target, input.affects) || target.eliminated) return [];
    if (distance(input.source, target) > input.radius) return [];
    const endsAt = input.startsAt + input.durationSec;
    return [
      {
        targetPlacementId: target.id,
        effect: 'concuss',
        severity: 'front',
        strength: 0.72,
        startsAt: input.startsAt,
        endsAt,
        fadeEndsAt: endsAt + input.fadeSec,
      },
    ];
  });
}

export function computeCircularConcussTargetsFromSources(input: {
  sources: MapPoint[];
  casterSide: MapAgentPlacement['side'];
  affects: AbilityAffectsRule;
  radius: number;
  targets: MapAgentPlacement[];
  startsAt: number;
  durationSec: number;
  fadeSec: number;
}): AbilityAffectedStatus[] {
  const byTarget = new Map<string, AbilityAffectedStatus>();
  for (const source of input.sources) {
    for (const status of computeCircularConcussTargets({ ...input, source })) {
      if (!byTarget.has(status.targetPlacementId)) {
        byTarget.set(status.targetPlacementId, status);
      }
    }
  }
  return [...byTarget.values()];
}

export function computeLineZoneStatusTargets(input: {
  origin: MapPoint;
  facing: number;
  length: number;
  width: number;
  casterSide: MapAgentPlacement['side'];
  affects: AbilityAffectsRule;
  targets: MapAgentPlacement[];
  startsAt: number;
  durationSec: number;
  fadeSec: number;
  effect: AbilityStatusEffectType;
}): AbilityAffectedStatus[] {
  const ux = Math.cos(input.facing);
  const uy = Math.sin(input.facing);
  const halfWidth = input.width / 2;

  return input.targets.flatMap((target) => {
    if (!canAffectTarget(input.casterSide, target, input.affects) || target.eliminated) return [];
    const dx = target.x - input.origin.x;
    const dy = target.y - input.origin.y;
    const forward = dx * ux + dy * uy;
    if (forward < 0 || forward > input.length) return [];
    const lateral = Math.abs(dx * -uy + dy * ux);
    if (lateral > halfWidth) return [];
    const endsAt = input.startsAt + input.durationSec;
    return [
      {
        targetPlacementId: target.id,
        effect: input.effect,
        severity: input.effect === 'concuss' ? 'front' : 'side',
        strength: input.effect === 'concuss' ? 0.72 : statusStrengthForSeverity('side'),
        startsAt: input.startsAt,
        endsAt,
        fadeEndsAt: endsAt + input.fadeSec,
      },
    ];
  });
}

export function resolveStatusOverlayOpacity(input: {
  strength: number;
  startsAt: number;
  endsAt: number;
  fadeEndsAt: number;
  playheadSec: number;
}): number {
  if (input.playheadSec < input.startsAt) return 0;
  if (input.playheadSec <= input.endsAt) return input.strength;
  if (input.playheadSec >= input.fadeEndsAt) return 0;
  const fadeDuration = input.fadeEndsAt - input.endsAt;
  if (fadeDuration <= 0) return 0;
  const fadeProgress = (input.playheadSec - input.endsAt) / fadeDuration;
  return input.strength * (1 - fadeProgress);
}

export function updateAffectedStatusSeverity(
  status: AbilityAffectedStatus,
  severity: AbilityStatusSeverity,
): AbilityAffectedStatus {
  return {
    ...status,
    severity,
    strength: statusStrengthForSeverity(severity),
    manual: true,
  };
}

export function strongestActiveStatusForTarget(
  statuses: AbilityAffectedStatus[],
  targetPlacementId: string,
  playheadSec: number,
): AbilityAffectedStatus | null {
  let best: { status: AbilityAffectedStatus; opacity: number } | null = null;
  for (const status of statuses) {
    if (status.targetPlacementId !== targetPlacementId) continue;
    const opacity = resolveStatusOverlayOpacity({ ...status, playheadSec });
    if (opacity <= 0) continue;
    if (!best || opacity > best.opacity) {
      best = { status, opacity };
    }
  }
  return best?.status ?? null;
}
