/** 与 playvalorant.com 特工列表一致，用于对阵配置 */
export interface AgentCatalogEntry {
  id: string;
  label: string;
}

export const AGENTS_CATALOG: AgentCatalogEntry[] = [
  { id: 'astra', label: 'Astra' },
  { id: 'breach', label: 'Breach' },
  { id: 'brimstone', label: 'Brimstone' },
  { id: 'chamber', label: 'Chamber' },
  { id: 'clove', label: 'Clove' },
  { id: 'cypher', label: 'Cypher' },
  { id: 'deadlock', label: 'Deadlock' },
  { id: 'fade', label: 'Fade' },
  { id: 'gekko', label: 'Gekko' },
  { id: 'harbor', label: 'Harbor' },
  { id: 'iso', label: 'Iso' },
  { id: 'jett', label: 'Jett' },
  { id: 'kay-o', label: 'KAY/O' },
  { id: 'killjoy', label: 'Killjoy' },
  { id: 'miks', label: 'Miks' },
  { id: 'neon', label: 'Neon' },
  { id: 'omen', label: 'Omen' },
  { id: 'phoenix', label: 'Phoenix' },
  { id: 'raze', label: 'Raze' },
  { id: 'reyna', label: 'Reyna' },
  { id: 'sage', label: 'Sage' },
  { id: 'skye', label: 'Skye' },
  { id: 'sova', label: 'Sova' },
  { id: 'tejo', label: 'Tejo' },
  { id: 'veto', label: 'Veto' },
  { id: 'viper', label: 'Viper' },
  { id: 'vyse', label: 'Vyse' },
  { id: 'waylay', label: 'Waylay' },
  { id: 'yoru', label: 'Yoru' },
];

export function getAgentById(id: string): AgentCatalogEntry | undefined {
  return AGENTS_CATALOG.find((a) => a.id === id);
}

export function getAgentLabel(id: string): string {
  return getAgentById(id)?.label ?? id;
}
