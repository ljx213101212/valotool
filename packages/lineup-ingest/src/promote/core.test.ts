import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLineup, mergeLineups, mustLearnViolations } from './core';
import type { DraftLineup } from '../types';

function approved(id: string, tier = 'must-learn'): DraftLineup {
  return {
    draftId: 'BV-0',
    fields: {
      id,
      map: 'ascent',
      agent: 'sova',
      side: 'attack',
      site: 'A',
      abilitySlot: 'E',
      tier: tier as DraftLineup['fields']['tier'],
      status: 'verified',
      verifiedPatch: '12.11',
      title: '标题',
      purpose: '用途',
      technique: 'stand',
      origin: '站位',
      target: '落点',
    },
    frames: { stand: 's.png', aim: 'a.png', effect: 'e.png' },
    candidates: [],
    provenance: { videoId: 'BV', url: 'https://x', creator: 'c', startSec: 0, endSec: 1 },
    confidence: 1,
    warnings: [],
    reviewStatus: 'approved',
  };
}

test('buildLineup：组装合法 Lineup，images 用 CDN 模式 url', () => {
  const l = buildLineup(approved('ascent-sova-atk-a-1'), 'https://cdn.test');
  assert.equal(l.id, 'ascent-sova-atk-a-1');
  assert.equal(l.images.length, 3);
  assert.equal(l.images[0].url, 'https://cdn.test/ascent-sova-atk-a-1/stand.webp');
});

test('buildLineup：非法草稿（id 非 kebab）抛错', () => {
  assert.throws(() => buildLineup(approved('Bad Id'), 'https://cdn.test'));
});

test('mergeLineups：按 id 去重 incoming 覆盖 + 按 tier 排序', () => {
  const a = buildLineup(approved('x-1', 'advanced'), 'https://c');
  const b = buildLineup(approved('x-2', 'must-learn'), 'https://c');
  const merged = mergeLineups([a], [b, buildLineup(approved('x-1', 'flashy'), 'https://c')]);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].tier, 'must-learn', 'x-2 排前');
  assert.equal(merged.find((l) => l.id === 'x-1')?.tier, 'flashy', 'incoming 覆盖');
});

test('mustLearnViolations：同 map-agent 超 5 报警', () => {
  const ls = Array.from({ length: 6 }, (_, i) => buildLineup(approved(`ascent-sova-atk-a-${i}`), 'https://c'));
  assert.equal(mustLearnViolations(ls).length, 1);
  assert.equal(mustLearnViolations(ls.slice(0, 5)).length, 0);
});
