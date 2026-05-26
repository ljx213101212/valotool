import type { AbilityPlacement, AbilityPlacementState } from '@/shared/types/ability';
import type { LineSmokeGeometry } from '@/shared/types/lineSmoke';

const VALID_STATES = new Set<AbilityPlacementState>(['initial', 'active', 'expired']);

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
      ...(lineSmoke ? { lineSmoke } : {}),
    });
  }
  return out;
}
