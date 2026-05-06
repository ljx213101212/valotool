import { valorantMap } from '@/data/valorantMap';
import type { MapAgentPlacement, MatchupSide } from '@/types/matchup';
import type { TacticalMap } from '@/types/map';

function defaultPlacementForSide(
  side: MatchupSide,
  indexOnSide: number,
  bounds: TacticalMap['bounds']
): { x: number; y: number } {
  const cx = (bounds.min.x + bounds.max.x) / 2;
  const cy = (bounds.min.y + bounds.max.y) / 2;
  const spanX = bounds.max.x - bounds.min.x;
  const biasX = side === 'attack' ? -spanX * 0.16 : spanX * 0.16;
  const angle = indexOnSide * 1.05 + (side === 'defense' ? 2.2 : 0.5);
  const radius = 36 + (indexOnSide % 6) * 26;
  return {
    x: cx + biasX + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
}

function defaultFacingForSide(side: MatchupSide): number {
  return side === 'attack' ? 0 : Math.PI;
}

function placementKey(p: Pick<MapAgentPlacement, 'side' | 'agentId'>): string {
  return `${p.side}:${p.agentId}`;
}

/** 与阵容同步：去掉已离队特工，并为新加入者生成默认坐标与朝向 */
export function reconcileMapPlacements(
  attackAgentIds: string[],
  defenseAgentIds: string[],
  existing: MapAgentPlacement[] | undefined
): MapAgentPlacement[] {
  const bounds = valorantMap.bounds;
  const roster = new Set<string>([
    ...attackAgentIds.map((id) => `attack:${id}`),
    ...defenseAgentIds.map((id) => `defense:${id}`),
  ]);

  const kept = (existing ?? []).filter((p) => roster.has(placementKey(p)));
  const have = new Set(kept.map(placementKey));

  const out = [...kept];
  let attackIdx = kept.filter((p) => p.side === 'attack').length;
  for (const agentId of attackAgentIds) {
    const key = placementKey({ side: 'attack', agentId });
    if (have.has(key)) continue;
    out.push({
      id: crypto.randomUUID(),
      side: 'attack',
      agentId,
      ...defaultPlacementForSide('attack', attackIdx++, bounds),
      facing: defaultFacingForSide('attack'),
    });
    have.add(key);
  }

  let defenseIdx = kept.filter((p) => p.side === 'defense').length;
  for (const agentId of defenseAgentIds) {
    const key = placementKey({ side: 'defense', agentId });
    if (have.has(key)) continue;
    out.push({
      id: crypto.randomUUID(),
      side: 'defense',
      agentId,
      ...defaultPlacementForSide('defense', defenseIdx++, bounds),
      facing: defaultFacingForSide('defense'),
    });
    have.add(key);
  }

  return out;
}
