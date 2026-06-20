import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AGENTS, MAPS, findAgent, findMap, getAgent, getMap } from './registry';

test('注册表覆盖全部竞技地图与英雄', () => {
  assert.equal(MAPS.length, 12);
  assert.ok(AGENTS.length >= 29);
});

test('地图：中文名/拼音首字母/别名均可命中', () => {
  assert.equal(findMap('亚海悬城')?.slug, 'ascent');
  assert.equal(findMap('yhxc')?.slug, 'ascent');
  assert.equal(findMap('亚海')?.slug, 'ascent');
  assert.equal(findMap('隐士修所')?.slug, 'haven'); // 常见错写
  assert.equal(findMap('Ascent')?.slug, 'ascent');
});

test('英雄：黑话别名命中', () => {
  assert.equal(findAgent('火男')?.slug, 'phoenix');
  assert.equal(findAgent('奶妈')?.slug, 'sage');
  assert.equal(findAgent('毒姐')?.slug, 'viper');
  assert.equal(findAgent('KAY/O')?.slug, 'kayo'); // 标点归一化
});

test('图池标记存在且非空', () => {
  const pool = MAPS.filter((m) => m.inRankedPool);
  assert.ok(pool.length >= 5);
});

test('英雄技能槽位齐全（C/Q/E/X）', () => {
  for (const agent of AGENTS) {
    assert.deepEqual(
      agent.abilities.map((a) => a.slot),
      ['C', 'Q', 'E', 'X'],
      `${agent.slug} 槽位异常`,
    );
  }
});

test('未知 token 返回 undefined', () => {
  assert.equal(findMap('不存在的地图'), undefined);
  assert.equal(getMap('nope'), undefined);
  assert.equal(getAgent('nope'), undefined);
});
