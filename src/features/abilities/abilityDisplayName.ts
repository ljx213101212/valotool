import { ABILITIES_BY_AGENT, agentCatalogIdToAbilitySlug } from './config';
import type { AbilitySlot } from './config';

export function getAbilityDisplayName(
  agentCatalogId: string,
  abilitySlot: AbilitySlot
): string {
  const slug = agentCatalogIdToAbilitySlug(agentCatalogId);
  const entry = ABILITIES_BY_AGENT[slug]?.find((r) => r.name === abilitySlot);
  return entry?.displayName ?? abilitySlot;
}
