import { getAbilityDisplayName } from './abilityDisplayName';
import {
  ABILITY_EFFECT_META,
  type AbilityEffectKind,
  type AbilitySlot,
  type AgentAbilitySlug,
} from './config';

const LINE_SMOKE_KINDS: readonly AbilityEffectKind[] = [
  'smoke-line-fixed-dual',
  'smoke-line-fixed-single',
  'smoke-line-drawable',
];

export type SmokeCatalogEntry = {
  agentSlug: AgentAbilitySlug;
  slot: AbilitySlot;
  displayName: string;
  effectKinds: readonly AbilityEffectKind[];
};

function collectSmokeCatalog(
  match: (kind: AbilityEffectKind) => boolean,
): SmokeCatalogEntry[] {
  const out: SmokeCatalogEntry[] = [];
  for (const agentSlug of Object.keys(ABILITY_EFFECT_META) as AgentAbilitySlug[]) {
    const slots = ABILITY_EFFECT_META[agentSlug];
    if (!slots) continue;
    for (const slot of Object.keys(slots) as AbilitySlot[]) {
      const meta = slots[slot];
      if (!meta?.effectKinds.some(match)) continue;
      out.push({
        agentSlug,
        slot,
        displayName: getAbilityDisplayName(agentSlug, slot),
        effectKinds: meta.effectKinds,
      });
    }
  }
  return out.sort(
    (a, b) =>
      a.agentSlug.localeCompare(b.agentSlug) || a.slot.localeCompare(b.slot),
  );
}

/** 已配置地图效果的笔直线烟 + 弯曲线烟 */
export function listLineSmokeCatalog(): SmokeCatalogEntry[] {
  return collectSmokeCatalog((kind) => LINE_SMOKE_KINDS.includes(kind));
}

/** 已配置地图效果的球型烟（含笼状） */
export function listSphereSmokeCatalog(): SmokeCatalogEntry[] {
  return collectSmokeCatalog((kind) => kind === 'smoke-sphere');
}

export function formatSmokeCatalogForLog(entries: SmokeCatalogEntry[]): string {
  return entries
    .map(
      (e) =>
        `${e.agentSlug} · ${e.slot} · ${e.displayName} [${e.effectKinds.join(', ')}]`,
    )
    .join('\n');
}
