import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeStaging } from './stage';
import type { DraftLineup } from '../types';

function draft(id: string, status: DraftLineup['reviewStatus']): DraftLineup {
  return {
    draftId: id,
    fields: {},
    frames: {},
    candidates: [],
    provenance: { videoId: 'v', url: 'https://x', creator: 'c', startSec: 0, endSec: 1 },
    confidence: 0,
    warnings: [],
    reviewStatus: status,
  };
}

test('mergeStaging：保留 approved/rejected，pending 用新结果覆盖', () => {
  const existing = [draft('a', 'approved'), draft('b', 'pending'), draft('c', 'rejected')];
  const fresh = [draft('a', 'pending'), draft('b', 'pending'), draft('c', 'pending')];
  fresh[1].confidence = 0.6; // 标记新结果
  const m = mergeStaging(existing, fresh);
  assert.equal(m.find((d) => d.draftId === 'a')?.reviewStatus, 'approved');
  assert.equal(m.find((d) => d.draftId === 'c')?.reviewStatus, 'rejected');
  assert.equal(m.find((d) => d.draftId === 'b')?.confidence, 0.6);
});

test('mergeStaging：无既有 → 全用新；丢弃既有里已不存在的段', () => {
  assert.equal(mergeStaging([], [draft('a', 'pending')]).length, 1);
  // 既有 approved 但新一轮没这个段 → 不凭空保留
  assert.equal(mergeStaging([draft('x', 'approved')], [draft('a', 'pending')]).length, 1);
});
