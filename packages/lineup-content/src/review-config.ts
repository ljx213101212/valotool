export interface FrameRoleConfig {
  role: string;
  label: string;
  description?: string;
}

export interface AgentReviewConfig {
  frameRoles: FrameRoleConfig[];
}

export const DEFAULT_FRAME_ROLES: FrameRoleConfig[] = [
  { role: 'stand', label: '站哪', description: '玩家所站位置' },
  { role: 'aim', label: '瞄哪', description: '准星瞄准位置' },
  { role: 'effect', label: '落点效果', description: '技能落点 / 生效效果' },
];

export const AGENT_REVIEW_CONFIGS: Record<string, AgentReviewConfig> = {
  jett: {
    frameRoles: [
      { role: 'smoke_request', label: '向队友要什么技能', description: '需要队友配合的技能' },
      { role: 'trigger_timing', label: '触发时机', description: '何时触发' },
      { role: 'smoke_landing', label: '瞬云落点', description: '瞬云烟雾落点位置' },
      { role: 'dash_direction', label: 'dash看哪边', description: 'dash 时视角朝向' },
      { role: 'dash_landing', label: 'dash落点', description: 'dash 结束落点位置' },
      { role: 'first_angle', label: '第一枪位瞄哪', description: 'dash 后第一枪位瞄准点' },
    ],
  },
};

export function getAgentFrameRoles(agentSlug: string): FrameRoleConfig[] {
  return AGENT_REVIEW_CONFIGS[agentSlug]?.frameRoles ?? DEFAULT_FRAME_ROLES;
}

export function getAgentFrameRoleLabels(agentSlug: string): Record<string, string> {
  const roles = getAgentFrameRoles(agentSlug);
  return Object.fromEntries(roles.map((r) => [r.role, r.label]));
}
