import { IMAGE_ROLES, lineupSchema, getAgentFrameRoles } from '@valotool/lineup-content';
import type { DraftLineup } from '../types';

const SIDE_ABBR: Record<string, string> = { attack: 'atk', defense: 'def' };

/** 为缺失字段填默认值（不覆盖已有），降低人审负担：自动 id + 常见 technique/tier/status。 */
export function suggestDefaults(draft: DraftLineup): DraftLineup['fields'] {
  const f = draft.fields;
  const idx = draft.draftId.split('-').pop() ?? '0';
  const autoId = [f.map, f.agent, f.side ? SIDE_ABBR[f.side] : undefined, f.site?.toLowerCase(), idx]
    .filter(Boolean)
    .join('-');
  return { id: autoId, technique: 'stand', status: 'draft', tier: 'must-learn', ...f } as DraftLineup['fields'];
}

export interface ReviewPatch {
  fields?: Record<string, unknown>;
  frames?: Record<string, string | undefined>;
  reviewStatus?: DraftLineup['reviewStatus'];
}

/** 合并一次审核编辑（字段/帧/状态），返回新草稿，不改原对象。 */
export function applyReview(draft: DraftLineup, patch: ReviewPatch): DraftLineup {
  const mergedFrames = { ...draft.frames };
  if (patch.frames) {
    for (const [k, v] of Object.entries(patch.frames)) {
      if (v === undefined) delete mergedFrames[k];
      else mergedFrames[k] = v;
    }
  }
  return {
    ...draft,
    fields: { ...draft.fields, ...(patch.fields ?? {}) } as DraftLineup['fields'],
    frames: mergedFrames,
    reviewStatus: patch.reviewStatus ?? draft.reviewStatus,
  };
}

/** 由 fields + 指派的三帧拼成 Lineup 形状的对象（images 按 stand→aim→effect 排序）。 */
export function draftToLineupInput(draft: DraftLineup): Record<string, unknown> {
  const images = (IMAGE_ROLES as readonly string[])
    .filter((r) => draft.frames[r])
    .map((r) => ({ role: r, url: draft.frames[r] }));
  return { ...draft.fields, images };
}

/** approve 闸门：用 lineupSchema 预校验整条，并校验必填帧角色。返回是否通过与缺失字段。 */
export function validateForApproval(draft: DraftLineup): { ok: boolean; issues: string[] } {
  const issues: string[] = [];

  // 校验必填帧角色
  const agentSlug = draft.fields.agent ?? '';
  const frameRoles = getAgentFrameRoles(agentSlug);
  const requiredRoles = frameRoles.filter((r) => r.required).map((r) => r.role);
  for (const role of requiredRoles) {
    if (!draft.frames[role]) {
      issues.push(`缺少必填帧: ${role}`);
    }
  }

  // 校验 lineupSchema
  const r = lineupSchema.safeParse(draftToLineupInput(draft));
  if (!r.success) {
    for (const i of r.error.issues) {
      issues.push(`${i.path.join('.') || '(root)'}: ${i.message}`);
    }
  }

  return { ok: issues.length === 0, issues };
}
