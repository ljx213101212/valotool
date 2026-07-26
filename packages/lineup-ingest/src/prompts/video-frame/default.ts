import { DEFAULT_FRAME_ROLES } from '@valotool/lineup-content';

/** 默认通用 prompt：stand/aim/effect 三帧，适合没有专属 prompt 的英雄 */
export function buildDefaultVideoPrompt(title: string, durationSec: number): string {
  const roles = DEFAULT_FRAME_ROLES;
  return [
    `你正在看一段 Valorant《无畏契约》游戏视频片段（${durationSec} 秒）。`,
    title ? `视频标题：「${title}」。` : '',
    '',
    '请仔细观看视频，找出每个关键阶段对应的时间点：',
    ...roles.map((r) => `- **${r.role} (${r.label})**：${r.description ?? r.label}`),
    '',
    `只输出 JSON（不要解释、不要 markdown 围栏），timeSec 为 0~${durationSec} 的整数秒，时间必须严格递增：`,
    '{',
    ...roles.map((r) => `  "${r.role}": { "timeSec": <秒>, "desc": "<20字>" },`),
    '}',
    '找不到某帧就填 null。',
  ].filter(Boolean).join('\n');
}
