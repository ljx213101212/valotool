import test from 'node:test';
import assert from 'node:assert/strict';
import { applyReview, validateForApproval } from './core';
import type { DraftLineup } from '../types';

function baseDraft(): DraftLineup {
  return {
    draftId: 'BV-0',
    fields: { map: 'ascent', agent: 'sova', side: 'attack', site: 'A', verifiedPatch: '12.11' },
    frames: {},
    candidates: [],
    provenance: { videoId: 'BV', url: 'https://x', creator: 'c', startSec: 0, endSec: 1 },
    confidence: 0.1,
    warnings: [],
    reviewStatus: 'pending',
  };
}

const COMPLETE = {
  id: 'ascent-sova-atk-a-test',
  abilitySlot: 'E',
  tier: 'must-learn',
  status: 'verified',
  title: '测试点位',
  purpose: '封烟挡视野',
  technique: 'stand',
  origin: 'A 大箱后',
  target: 'A 斜坡',
};

test('applyReview 合并字段/帧/状态，不改原对象', () => {
  const orig = baseDraft();
  const d = applyReview(orig, { fields: { purpose: '封烟' }, frames: { stand: 'a.png' }, reviewStatus: 'approved' });
  assert.equal(d.fields.purpose, '封烟');
  assert.equal(d.frames.stand, 'a.png');
  assert.equal(d.reviewStatus, 'approved');
  assert.equal(orig.reviewStatus, 'pending', '原对象不被修改');
});

test('validateForApproval：完整草稿 + 三帧 → 通过', () => {
  const d = applyReview(baseDraft(), {
    fields: COMPLETE,
    frames: { stand: 's.png', aim: 'a.png', effect: 'e.png' },
  });
  const v = validateForApproval(d);
  assert.equal(v.ok, true, v.issues.join('; '));
});

test('validateForApproval：缺字段/无帧 → 拒绝并报字段', () => {
  const v = validateForApproval(baseDraft());
  assert.equal(v.ok, false);
  assert.ok(v.issues.length > 0);
});

test('validateForApproval：非 kebab 的 id 被拒', () => {
  const d = applyReview(baseDraft(), {
    fields: { ...COMPLETE, id: 'Ascent Sova 测试' },
    frames: { stand: 's.png', aim: 'a.png', effect: 'e.png' },
  });
  assert.equal(validateForApproval(d).ok, false);
});
