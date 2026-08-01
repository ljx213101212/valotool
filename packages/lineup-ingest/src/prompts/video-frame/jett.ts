import { getAgentFrameRoles } from '@valotool/lineup-content';

/**
 * Jett 一突进点 prompt。
 * Jett 的典型动线：站位 → 瞄准参照物 → 释放瞬云烟雾 → smoke 落地 →
 *   → 准备 dash → dash 落点 → 第一枪位
 */
export function buildJettVideoPrompt(title: string, durationSec: number): string {
  const roles = getAgentFrameRoles('jett');
  return [
    '你是 Valorant《无畏契约》的职业教练，专门分析 Jett（婕提）一突进点教学视频。',
    `视频标题：「${title || '(未知)'}」(0s-${durationSec}s)。地图：未知。`,
    '',
    '=== Jett 技能 ===',
    '- C：瞬云（烟雾弹），左手投掷一团灰白色烟雾，飞行一段后展开',
    '- Q：升腾（跳高），向上跳跃飞起',
    '- E：逐风（冲刺），快速向准星方向位移，画面有运动拖影/残影',
    '- X：剑刃风暴（大招），投掷飞刀',
    '',
    '=== Jett 一突进点标准流程 ===',
    '请按顺序逐一找出以下阶段的时间点：',
    '',
    '1. **stand（站哪）**：Jett 走到起始位置后停下、不再移动。准星开始对准参照物（墙角、箱子边缘、云、建筑轮廓）。',
    '   画面特征：角色模型静止，HUD 技能图标亮着可用。',
    '',
    '2. **aim（瞄哪）**：准星已精确对准技能落点的参照物（某个固定环境标记），画面不再晃。',
    '   画面特征：屏幕中央十字准星稳定对准某个具体位置。',
    '',
    '3. **smoke_landing（瞬云落点）**：Jett 释放 C 键「瞬云」烟雾后的画面。',
    '   识别要点：Jett 左手向前一甩（投掷动画），画面中央出现移动的灰白色烟雾球，或烟雾已在空中/地面展开。HUD 上 C 技能图标进入冷却。',
    '',
    '4. **trigger_timing（触发时机）**：烟雾完全展开后、Jett 准备 dash 前的最后瞬间。',
    '   识别要点：HUD 上 E 技能「逐风」图标亮着可用，Jett 短暂停顿，视角可能开始转动。',
    '',
    '5. **dash_landing（dash 落点）**：Jett 释放 E 键「逐风」冲刺后，落地结束 dash 的瞬间。',
    '   识别要点：画面从运动拖影/模糊变清晰，玩家视角稳定在新位置。HUD 上 E 技能图标进入冷却。',
    '',
    '6. **first_angle（第一枪位瞄哪）**：dash 落点后，Jett 调整视角、准星对准需要优先清掉的第一枪位。',
    '   识别要点：准星快速转动后停在一个新的方向（门/角落/掩体后方），这是进点成功的最后一步。',
    '',
    '=== 输出格式 ===',
    '只输出 JSON（不要解释、不要 markdown 围栏）：',
    '{',
    '  "stand":           { "timeSec": <秒>, "desc": "<20字>" },',
    '  "aim":             { "timeSec": <秒>, "desc": "<20字>" },',
    '  "smoke_landing":   { "timeSec": <秒>, "desc": "<20字>" },',
    '  "trigger_timing":  { "timeSec": <秒>, "desc": "<20字>" },',
    '  "dash_landing":    { "timeSec": <秒>, "desc": "<20字>" },',
    '  "first_angle":     { "timeSec": <秒>, "desc": "<20字>" }',
    '}',
    '',
    '重要：',
    `- timeSec 是视频内时间（0~${durationSec} 的整数秒）。`,
    '- 6 帧的时间必须严格递增（stand < aim < smoke_landing < trigger_timing < dash_landing < first_angle），不能相等。',
    '- 找不到某帧就填 null。例如找不到 first_angle 就写 "first_angle": null。',
  ].join('\n');
}
