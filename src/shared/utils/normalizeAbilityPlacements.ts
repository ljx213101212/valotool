import type { AbilityPlacement, AbilityPlacementState } from '@/shared/types/ability';
import type { LineSmokeGeometry } from '@/shared/types/lineSmoke';
import type { CurveSmokeGeometry } from '@/shared/types/curveSmoke';
import type {
  DirectMovementGeometry,
  MovementDisplacement,
  MovementAnchorGeometry,
  MovementAnchorKind,
  MovementAnchorStatus,
} from '@/shared/types/movement';

const VALID_STATES = new Set<AbilityPlacementState>(['initial', 'active', 'expired']);
const VALID_ANCHOR_KINDS = new Set<MovementAnchorKind>(['refract', 'rendezvous', 'blast-pack']);
const VALID_ANCHOR_STATUSES = new Set<MovementAnchorStatus>(['armed', 'triggered']);

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
    });
  }
  return out;
}
