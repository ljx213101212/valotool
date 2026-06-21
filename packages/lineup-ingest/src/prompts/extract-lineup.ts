import { abilitySlotSchema, techniqueSchema } from '@valotool/lineup-content';
import type { ExtractInput } from '../extractors/types';

/**
 * 构造给多模态 VLM 的文字指令（图像随消息另传）。
 * 硬字段（map/agent/side/site）不在此抽——已由 hints/parseQuery 确定。
 * 只让模型出软字段、schema 约束、看不准就省略不编造。
 */
export function buildExtractPrompt(input: ExtractInput): string {
  return [
    '你在看一张《无畏契约/Valorant》点位教学的连续截图（接触表，按时间从左到右、从上到下排列）。',
    input.hints?.map ? `地图：${input.hints.map}` : '',
    input.hints?.agent ? `英雄：${input.hints.agent}` : '',
    input.title ? `这条点位的标题：${input.title}` : '',
    input.subtitleText ? `补充信息：${input.subtitleText}` : '',
    '',
    '判断这条点位，只输出 JSON（不要解释、不要 ``` 围栏），键：',
    `- abilitySlot：技能键，取值之一 ${abilitySlotSchema.options.join('/')}；Sova：C=无人机, Q=电箭(伤害), E=探测箭(紫色声呐显形), X=大招。`,
    `- technique：手法，取值之一 ${techniqueSchema.options.join('/')}。`,
    '- origin：站位（人站在哪扔），简短中文。',
    '- target：落点（技能落在哪/覆盖什么），简短中文。',
    '- purpose：用途（这条点位干嘛用），简短中文。',
    '- timing：时机（可选，没有就省略该键）。',
    '看不准的键就省略，不要编造。',
  ]
    .filter(Boolean)
    .join('\n');
}
