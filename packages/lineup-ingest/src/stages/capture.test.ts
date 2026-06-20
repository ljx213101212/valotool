import test from 'node:test';
import assert from 'node:assert/strict';
import { toCandidates } from './capture';

test('候选 atSec = startSec + 序号（与接触表格子对齐）', () => {
  assert.deepEqual(toCandidates(['a.png', 'b.png', 'c.png'], 22), [
    { path: 'a.png', atSec: 22 },
    { path: 'b.png', atSec: 23 },
    { path: 'c.png', atSec: 24 },
  ]);
});

test('空帧 → 空候选', () => {
  assert.deepEqual(toCandidates([], 10), []);
});
