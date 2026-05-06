/** 与 playvalorant.com 特工列表一致，用于对阵配置 */
export type AgentRole = 'duelist' | 'initiator' | 'sentinel' | 'controller';

export interface AgentCatalogEntry {
  id: string;
  label: string;
  role: AgentRole;
}

/** 职位筛选用文案（图标可后续替换） */
export const ROLE_FILTER_LABELS: Record<AgentRole, string> = {
  duelist: '决斗',
  initiator: '信息',
  sentinel: '哨位',
  controller: '控场',
};

export const AGENTS_CATALOG: AgentCatalogEntry[] = [
  { id: 'astra', label: 'Astra', role: 'controller' },
  { id: 'breach', label: 'Breach', role: 'initiator' },
  { id: 'brimstone', label: 'Brimstone', role: 'controller' },
  { id: 'chamber', label: 'Chamber', role: 'sentinel' },
  { id: 'clove', label: 'Clove', role: 'controller' },
  { id: 'cypher', label: 'Cypher', role: 'sentinel' },
  { id: 'deadlock', label: 'Deadlock', role: 'sentinel' },
  { id: 'fade', label: 'Fade', role: 'initiator' },
  { id: 'gekko', label: 'Gekko', role: 'initiator' },
  { id: 'harbor', label: 'Harbor', role: 'controller' },
  { id: 'iso', label: 'Iso', role: 'duelist' },
  { id: 'jett', label: 'Jett', role: 'duelist' },
  { id: 'kay-o', label: 'KAY/O', role: 'initiator' },
  { id: 'killjoy', label: 'Killjoy', role: 'sentinel' },
  { id: 'miks', label: 'Miks', role: 'controller' },
  { id: 'neon', label: 'Neon', role: 'duelist' },
  { id: 'omen', label: 'Omen', role: 'controller' },
  { id: 'phoenix', label: 'Phoenix', role: 'duelist' },
  { id: 'raze', label: 'Raze', role: 'duelist' },
  { id: 'reyna', label: 'Reyna', role: 'duelist' },
  { id: 'sage', label: 'Sage', role: 'sentinel' },
  { id: 'skye', label: 'Skye', role: 'initiator' },
  { id: 'sova', label: 'Sova', role: 'initiator' },
  { id: 'tejo', label: 'Tejo', role: 'initiator' },
  { id: 'veto', label: 'Veto', role: 'sentinel' },
  { id: 'viper', label: 'Viper', role: 'controller' },
  { id: 'vyse', label: 'Vyse', role: 'sentinel' },
  { id: 'waylay', label: 'Waylay', role: 'duelist' },
  { id: 'yoru', label: 'Yoru', role: 'duelist' },
];

export type RoleFilter = 'all' | AgentRole;

export function getAgentById(id: string): AgentCatalogEntry | undefined {
  return AGENTS_CATALOG.find((a) => a.id === id);
}

export function getAgentLabel(id: string): string {
  return getAgentById(id)?.label ?? id;
}

export function filterAgentsByRole(role: RoleFilter): AgentCatalogEntry[] {
  if (role === 'all') return AGENTS_CATALOG;
  return AGENTS_CATALOG.filter((a) => a.role === role);
}
