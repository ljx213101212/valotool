import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Lineup } from './schema';
import { validateContent } from './validate';

const base: Lineup = {
  id: 'ascent-sova-atk-a-1',
  map: 'ascent',
  agent: 'sova',
  abilitySlot: 'E',
  side: 'attack',
  site: 'A',
  tier: 'must-learn',
  title: '测试点位',
  purpose: '测试',
  technique: 'stand',
  origin: '起点',
  target: '落点',
  images: [{ role: 'effect', url: 'https://e.com/1.webp' }],
  verifiedPatch: '10.11',
  status: 'draft',
  keywords: [],
};

const make = (over: Partial<Lineup>): Lineup => ({ ...base, ...over });

test('引用未知地图/英雄报错', () => {
  const { errors } = validateContent({
    'a.json': [make({ id: 'x-1', map: 'atlantis' }), make({ id: 'x-2', agent: 'gandalf' })],
  });
  assert.equal(errors.length, 2);
  assert.match(errors[0].message, /未知地图/);
  assert.match(errors[1].message, /未知英雄/);
});

test('跨文件 id 重复报错', () => {
  const { errors } = validateContent({
    'a.json': [make({ id: 'dup-1' })],
    'b.json': [make({ id: 'dup-1' })],
  });
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /id 重复/);
});

test('必学档超过 5 条产生告警但不报错', () => {
  const six = Array.from({ length: 6 }, (_, i) => make({ id: `ml-${i}` }));
  const { errors, warnings } = validateContent({ 'a.json': six });
  assert.equal(errors.length, 0);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0].message, /必学档超上限/);
});

test('schema 不合法的文件报错且不阻断其他文件', () => {
  const { errors, lineups } = validateContent({
    'bad.json': [{ id: 'broken' }],
    'good.json': [make({ id: 'ok-1' })],
  });
  assert.ok(errors.length > 0);
  assert.equal(lineups.length, 1);
});
