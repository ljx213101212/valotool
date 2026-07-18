import { abilitySlotSchema, techniqueSchema, type Lineup } from '@valotool/lineup-content';

export interface ParsedVlm {
  fields: Partial<Lineup>;
  warnings: string[];
}

const SOFT_TEXT = ['origin', 'target', 'purpose', 'timing'] as const;

/** 从可能带 ```json 围栏的文本里取出 JSON 对象。 */
function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse((fenced ? fenced[1] : raw).trim());
}

/**
 * 解析 VLM 原始输出为软字段，绝不盲信：
 * - 坏 JSON → 整体降级为空软字段 + warning
 * - abilitySlot/technique 非枚举 → 丢弃该字段 + warning
 * - origin/target/purpose/timing → 非空字符串才保留
 * side/site/map/agent 不在此处（由 parseQuery / hints 确定）。
 */
export function parseVlmOutput(raw: string): ParsedVlm {
  let obj: Record<string, unknown>;
  try {
    const parsed = extractJson(raw);
    if (!parsed || typeof parsed !== 'object') throw new Error('not an object');
    obj = parsed as Record<string, unknown>;
  } catch {
    return { fields: {}, warnings: ['VLM 输出非合法 JSON，软字段降级为空'] };
  }

  const fields: Partial<Lineup> = {};
  const warnings: string[] = [];

  if (obj.abilitySlot !== undefined) {
    const r = abilitySlotSchema.safeParse(obj.abilitySlot);
    if (r.success) fields.abilitySlot = r.data;
    else warnings.push(`VLM abilitySlot 非法（${String(obj.abilitySlot)}），已丢弃`);
  }
  if (obj.technique !== undefined) {
    const r = techniqueSchema.safeParse(obj.technique);
    if (r.success) fields.technique = r.data;
    else warnings.push(`VLM technique 非法（${String(obj.technique)}），已丢弃`);
  }
  for (const k of SOFT_TEXT) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) fields[k] = v.trim();
  }

  return { fields, warnings };
}
