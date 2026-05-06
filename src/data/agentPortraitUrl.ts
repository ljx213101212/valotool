const eager = import.meta.glob<string>('../assets/agents/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

function fileBaseFromPath(path: string): string {
  const m = path.match(/\/([^/]+)\.webp$/);
  return m?.[1] ?? '';
}

const fileBaseToUrl: Record<string, string> = {};
for (const [path, url] of Object.entries(eager)) {
  fileBaseToUrl[fileBaseFromPath(path)] = url;
}

/** 目录文件名与 agentsCatalog id 不一致时在此映射 */
const AGENT_ID_TO_FILE_BASE: Record<string, string> = {
  'kay-o': 'kayo',
};

export function getAgentPortraitUrl(agentId: string): string | undefined {
  const base = AGENT_ID_TO_FILE_BASE[agentId] ?? agentId;
  return fileBaseToUrl[base];
}
