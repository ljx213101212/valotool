import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseQuery } from './search';

test('中文紧凑组合：亚海猎枭防B', () => {
  const r = parseQuery('亚海猎枭防B');
  assert.deepEqual(r, { map: 'ascent', agent: 'sova', side: 'defense', site: 'B', unmatched: [] });
});

test('拼音首字母 + 英文 + 空格分段：yhxc sova 防守', () => {
  const r = parseQuery('yhxc sova 防守');
  assert.equal(r.map, 'ascent');
  assert.equal(r.agent, 'sova');
  assert.equal(r.side, 'defense');
});

test('黑话别名：亚海火男进攻A', () => {
  const r = parseQuery('亚海火男进攻A');
  assert.deepEqual(r, { map: 'ascent', agent: 'phoenix', side: 'attack', site: 'A', unmatched: [] });
});

test('仅地图与英雄：源工重镇蝰蛇', () => {
  const r = parseQuery('源工重镇蝰蛇');
  assert.equal(r.map, 'bind');
  assert.equal(r.agent, 'viper');
  assert.equal(r.side, undefined);
});

test('无法识别片段进 unmatched，不整体失败', () => {
  const r = parseQuery('外星基地猎枭防守');
  assert.equal(r.agent, 'sova');
  assert.equal(r.side, 'defense');
  assert.deepEqual(r.unmatched, ['外星基地']);
});

test('中路站点：莲华古城幽影中路', () => {
  const r = parseQuery('莲华古城幽影中路');
  assert.equal(r.map, 'lotus');
  assert.equal(r.agent, 'omen');
  assert.equal(r.site, 'mid');
});

test('官方名优先于别名歧义：霓虹解析为英雄', () => {
  const r = parseQuery('霓虹');
  assert.equal(r.agent, 'neon');
  assert.equal(r.map, undefined);
});
