import type {
  AbilityPlacement,
  AbilityPlacementState,
  AbilityProjectilePath,
} from '@/shared/types/ability';
import type { LineSmokeGeometry } from '@/shared/types/lineSmoke';
import type { CurveSmokeGeometry } from '@/shared/types/curveSmoke';
import type {
  DirectMovementGeometry,
  MovementDisplacement,
  MovementAnchorGeometry,
  MovementAnchorKind,
  MovementAnchorStatus,
} from '@/shared/types/movement';
import type {
  AbilityAffectedStatus,
  AbilityStatusGeometry,
  AbilityStatusSeverity,
} from '@/shared/types/abilityStatus';
import type {
  AbilityStatusEffectType,
  ConcussDeliveryKind,
  FlashDeliveryKind,
} from '@/features/abilities/config';

const VALID_STATES = new Set<AbilityPlacementState>(['initial', 'active', 'expired']);
const VALID_ANCHOR_KINDS = new Set<MovementAnchorKind>(['refract', 'rendezvous', 'blast-pack']);
const VALID_ANCHOR_STATUSES = new Set<MovementAnchorStatus>(['armed', 'triggered']);
const VALID_STATUS_EFFECTS = new Set<AbilityStatusEffectType>([
  'flash',
  'blind',
  'nearsight',
  'concuss',
]);
const VALID_STATUS_SEVERITIES = new Set<AbilityStatusSeverity>([
  'miss',
  'back',
  'side',
  'front',
]);
const VALID_FLASH_DELIVERIES = new Set<FlashDeliveryKind>([
  'projectile',
  'fixed-curve',
  'guided',
  'wall-burst',
  'enemy-only-source',
  'zone-projectile',
]);
const VALID_CONCUSS_DELIVERIES = new Set<ConcussDeliveryKind>(['circle', 'line-zone']);

function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizePoint(raw: unknown): { x: number; y: number } | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const point = raw as { x?: unknown; y?: unknown };
  if (!finiteNumber(point.x) || !finiteNumber(point.y)) return undefined;
  return { x: point.x, y: point.y };
}

function normalizeLineSmoke(raw: unknown): LineSmokeGeometry | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const ls = raw as Partial<LineSmokeGeometry>;
  if (
    typeof ls.cx !== 'number' ||
    typeof ls.cy !== 'number' ||
    typeof ls.facing !== 'number' ||
    !Number.isFinite(ls.cx) ||
    !Number.isFinite(ls.cy) ||
    !Number.isFinite(ls.facing)
  ) {
    return undefined;
  }
  return { cx: ls.cx, cy: ls.cy, facing: ls.facing };
}

function normalizeCurveSmoke(raw: unknown): CurveSmokeGeometry | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const cs = raw as Partial<CurveSmokeGeometry>;
  if (!Array.isArray(cs.points) || cs.points.length < 4) return undefined;
  if (!cs.points.every((n) => typeof n === 'number' && Number.isFinite(n))) {
    return undefined;
  }
  return { points: cs.points };
}

function normalizeMovementDisplacement(raw: unknown): MovementDisplacement | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const mv = raw as Partial<MovementDisplacement>;
  if (
    typeof mv.startX !== 'number' ||
    typeof mv.startY !== 'number' ||
    typeof mv.endX !== 'number' ||
    typeof mv.endY !== 'number' ||
    typeof mv.facing !== 'number' ||
    !Number.isFinite(mv.startX) ||
    !Number.isFinite(mv.startY) ||
    !Number.isFinite(mv.endX) ||
    !Number.isFinite(mv.endY) ||
    !Number.isFinite(mv.facing)
  ) {
    return undefined;
  }
  const placementId = typeof mv.placementId === 'string' ? mv.placementId : undefined;
  return {
    ...(placementId ? { placementId } : {}),
    startX: mv.startX,
    startY: mv.startY,
    endX: mv.endX,
    endY: mv.endY,
    facing: mv.facing,
  };
}

function normalizeDirectMovement(raw: unknown): DirectMovementGeometry | undefined {
  const base = normalizeMovementDisplacement(raw);
  if (!base || !raw || typeof raw !== 'object') return undefined;
  const mv = raw as Partial<DirectMovementGeometry>;
  const activationDelaySec =
    typeof mv.activationDelaySec === 'number' && Number.isFinite(mv.activationDelaySec)
      ? mv.activationDelaySec
      : undefined;
  const impactedPlacements = Array.isArray(mv.impactedPlacements)
    ? mv.impactedPlacements
        .map((entry) => normalizeMovementDisplacement(entry))
        .filter((entry): entry is MovementDisplacement => !!entry)
    : undefined;
  return {
    ...base,
    ...(activationDelaySec != null ? { activationDelaySec } : {}),
    ...(impactedPlacements?.length ? { impactedPlacements } : {}),
  };
}

function normalizeAnchorMovement(raw: unknown): MovementAnchorGeometry | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const am = raw as Partial<MovementAnchorGeometry>;
  if (
    typeof am.kind !== 'string' ||
    typeof am.status !== 'string' ||
    !VALID_ANCHOR_KINDS.has(am.kind as MovementAnchorKind) ||
    !VALID_ANCHOR_STATUSES.has(am.status as MovementAnchorStatus)
  ) {
    return undefined;
  }
  const radius =
    typeof am.radius === 'number' && Number.isFinite(am.radius) ? am.radius : undefined;
  return {
    kind: am.kind as MovementAnchorKind,
    status: am.status as MovementAnchorStatus,
    ...(radius != null ? { radius } : {}),
  };
}

function normalizeStatusGeometry(raw: unknown): AbilityStatusGeometry | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const sg = raw as Partial<AbilityStatusGeometry>;
  if (
    typeof sg.kind !== 'string' ||
    !VALID_STATUS_EFFECTS.has(sg.kind as AbilityStatusEffectType) ||
    !finiteNumber(sg.sourceX) ||
    !finiteNumber(sg.sourceY)
  ) {
    return undefined;
  }
  const radius = finiteNumber(sg.radius) ? sg.radius : undefined;
  const facing = finiteNumber(sg.facing) ? sg.facing : undefined;
  const length = finiteNumber(sg.length) ? sg.length : undefined;
  const width = finiteNumber(sg.width) ? sg.width : undefined;
  const flashDelivery =
    typeof sg.flashDelivery === 'string' &&
    VALID_FLASH_DELIVERIES.has(sg.flashDelivery as FlashDeliveryKind)
      ? (sg.flashDelivery as FlashDeliveryKind)
      : undefined;
  const concussDelivery =
    typeof sg.concussDelivery === 'string' &&
    VALID_CONCUSS_DELIVERIES.has(sg.concussDelivery as ConcussDeliveryKind)
      ? (sg.concussDelivery as ConcussDeliveryKind)
      : undefined;
  const impactPoints = Array.isArray(sg.impactPoints)
    ? sg.impactPoints
        .map((point) => normalizePoint(point))
        .filter((point): point is { x: number; y: number } => !!point)
    : undefined;

  return {
    kind: sg.kind as AbilityStatusEffectType,
    sourceX: sg.sourceX,
    sourceY: sg.sourceY,
    ...(radius != null ? { radius } : {}),
    ...(facing != null ? { facing } : {}),
    ...(length != null ? { length } : {}),
    ...(width != null ? { width } : {}),
    ...(flashDelivery ? { flashDelivery } : {}),
    ...(concussDelivery ? { concussDelivery } : {}),
    ...(impactPoints?.length ? { impactPoints } : {}),
  };
}

function normalizeDamageEffect(raw: unknown): AbilityPlacement['damageEffect'] | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const effect = raw as NonNullable<AbilityPlacement['damageEffect']>;
  if (
    !finiteNumber(effect.sourceX) ||
    !finiteNumber(effect.sourceY) ||
    !finiteNumber(effect.radius)
  ) {
    return undefined;
  }
  return {
    sourceX: effect.sourceX,
    sourceY: effect.sourceY,
    radius: effect.radius,
  };
}

function normalizeAffectedStatuses(raw: unknown): AbilityAffectedStatus[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const statuses = raw.flatMap((entry): AbilityAffectedStatus[] => {
    if (!entry || typeof entry !== 'object') return [];
    const status = entry as Partial<AbilityAffectedStatus>;
    if (
      typeof status.targetPlacementId !== 'string' ||
      typeof status.effect !== 'string' ||
      typeof status.severity !== 'string' ||
      !VALID_STATUS_EFFECTS.has(status.effect as AbilityStatusEffectType) ||
      !VALID_STATUS_SEVERITIES.has(status.severity as AbilityStatusSeverity) ||
      !finiteNumber(status.strength) ||
      status.strength < 0 ||
      status.strength > 1 ||
      !finiteNumber(status.startsAt) ||
      !finiteNumber(status.endsAt) ||
      !finiteNumber(status.fadeEndsAt)
    ) {
      return [];
    }
    return [
      {
        targetPlacementId: status.targetPlacementId,
        effect: status.effect as AbilityStatusEffectType,
        severity: status.severity as AbilityStatusSeverity,
        strength: status.strength,
        startsAt: status.startsAt,
        endsAt: status.endsAt,
        fadeEndsAt: status.fadeEndsAt,
        ...(status.manual === true ? { manual: true } : {}),
      },
    ];
  });
  return statuses.length ? statuses : undefined;
}

function normalizeProjectilePath(raw: unknown): AbilityProjectilePath | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const path = raw as Partial<AbilityProjectilePath>;
  if (!Array.isArray(path.segments) || !Array.isArray(path.hits)) return undefined;
  const terminal = normalizePoint(path.terminal);
  if (!terminal) return undefined;

  const segments = path.segments.flatMap((segment): AbilityProjectilePath['segments'] => {
    if (!segment || typeof segment !== 'object') return [];
    const maybeSegment = segment as Partial<AbilityProjectilePath['segments'][number]>;
    const from = normalizePoint(maybeSegment.from);
    const to = normalizePoint(maybeSegment.to);
    return from && to ? [{ from, to }] : [];
  });
  if (!segments.length) return undefined;

  const hits = path.hits.flatMap((hit): AbilityProjectilePath['hits'] => {
    if (!hit || typeof hit !== 'object') return [];
    const maybeHit = hit as Partial<AbilityProjectilePath['hits'][number]>;
    const point = normalizePoint(maybeHit.point);
    return typeof maybeHit.wallId === 'string' && point
      ? [{ wallId: maybeHit.wallId, point }]
      : [];
  });

  return { segments, hits, terminal };
}

export function normalizeAbilityPlacements(
  raw: unknown
): AbilityPlacement[] {
  if (!Array.isArray(raw)) return [];
  const out: AbilityPlacement[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const p = item as Partial<AbilityPlacement>;
    if (
      typeof p.id !== 'string' ||
      typeof p.ownerPlacementId !== 'string' ||
      typeof p.agentId !== 'string' ||
      typeof p.abilitySlot !== 'string' ||
      typeof p.x !== 'number' ||
      typeof p.y !== 'number'
    ) {
      continue;
    }
    const state =
      typeof p.state === 'string' && VALID_STATES.has(p.state as AbilityPlacementState)
        ? (p.state as AbilityPlacementState)
        : 'initial';
    const placedAt =
      typeof p.placedAt === 'number' && Number.isFinite(p.placedAt) ? p.placedAt : Date.now();
    const activeAt = typeof p.activeAt === 'number' && Number.isFinite(p.activeAt) ? p.activeAt : undefined;
    const expiresAt =
      typeof p.expiresAt === 'number' && Number.isFinite(p.expiresAt) ? p.expiresAt : undefined;
    const lineSmoke = normalizeLineSmoke(p.lineSmoke);
    const curveSmoke = normalizeCurveSmoke(p.curveSmoke);
    const directMovement = normalizeDirectMovement(p.directMovement);
    const anchorMovement = normalizeAnchorMovement(p.anchorMovement);
    const statusEffect = normalizeStatusGeometry(p.statusEffect);
    const damageEffect = normalizeDamageEffect(p.damageEffect);
    const affectedStatuses = normalizeAffectedStatuses(p.affectedStatuses);
    const projectilePath = normalizeProjectilePath(p.projectilePath);
    const legacyWall = p as { wallSmoke?: { cx?: number; cy?: number; facing?: number } };
    const wallAsLine =
      !lineSmoke &&
      legacyWall.wallSmoke &&
      typeof legacyWall.wallSmoke.cx === 'number' &&
      typeof legacyWall.wallSmoke.cy === 'number' &&
      typeof legacyWall.wallSmoke.facing === 'number'
        ? {
            cx: legacyWall.wallSmoke.cx,
            cy: legacyWall.wallSmoke.cy,
            facing: legacyWall.wallSmoke.facing,
          }
        : undefined;
    out.push({
      id: p.id,
      ownerPlacementId: p.ownerPlacementId,
      agentId: p.agentId,
      abilitySlot: p.abilitySlot,
      x: p.x,
      y: p.y,
      state,
      placedAt,
      ...(activeAt != null ? { activeAt } : {}),
      ...(expiresAt != null ? { expiresAt } : {}),
      ...(lineSmoke ? { lineSmoke } : wallAsLine ? { lineSmoke: wallAsLine } : {}),
      ...(curveSmoke ? { curveSmoke } : {}),
      ...(directMovement ? { directMovement } : {}),
      ...(anchorMovement ? { anchorMovement } : {}),
      ...(statusEffect ? { statusEffect } : {}),
      ...(damageEffect ? { damageEffect } : {}),
      ...(affectedStatuses ? { affectedStatuses } : {}),
      ...(projectilePath ? { projectilePath } : {}),
    });
  }
  return out;
}
