import assert from 'node:assert/strict';
import { test } from 'node:test';
import { lineupSchema } from './schema';

const valid = {
  id: 'ascent-sova-atk-a-default-recon',
  map: 'ascent',
  agent: 'sova',
  abilitySlot: 'E',
  side: 'attack',
  site: 'A',
  tier: 'must-learn',
  title: 'A点默认寻敌箭',
  purpose: '进点前侦察',
  technique: 'jump-throw',
  origin: 'A 主门外木箱后',
  target: '包点上方反弹',
  images: [
    { role: 'stand', url: 'https://example.com/stand.webp' },
    { role: 'aim', url: 'https://example.com/aim.webp' },
    { role: 'effect', url: 'https://example.com/effect.webp' },
  ],
  verifiedPatch: '10.11',
  status: 'draft',
};

test('合法点位通过 schema 校验', () => {
  const parsed = lineupSchema.parse(valid);
  assert.equal(parsed.keywords.length, 0); // 默认值
});

test('单图点位（仅 effect）也合法', () => {
  assert.ok(
    lineupSchema.safeParse({ ...valid, images: [{ role: 'effect', url: 'https://e.com/1.webp' }] })
      .success,
  );
});

test('缺 verifiedPatch 被拒绝', () => {
  const rest: Record<string, unknown> = { ...valid };
  delete rest.verifiedPatch;
  assert.equal(lineupSchema.safeParse(rest).success, false);
});

test('verifiedPatch 格式错误被拒绝', () => {
  assert.equal(lineupSchema.safeParse({ ...valid, verifiedPatch: 'v10' }).success, false);
});

test('图片 role 重复被拒绝', () => {
  const images = [
    { role: 'stand', url: 'https://e.com/1.webp' },
    { role: 'stand', url: 'https://e.com/2.webp' },
  ];
  assert.equal(lineupSchema.safeParse({ ...valid, images }).success, false);
});

test('图片顺序违反 stand→aim→effect 被拒绝', () => {
  const images = [
    { role: 'effect', url: 'https://e.com/1.webp' },
    { role: 'stand', url: 'https://e.com/2.webp' },
  ];
  assert.equal(lineupSchema.safeParse({ ...valid, images }).success, false);
});

test('超过 3 张图被拒绝', () => {
  const images = [
    { role: 'stand', url: 'https://e.com/1.webp' },
    { role: 'aim', url: 'https://e.com/2.webp' },
    { role: 'effect', url: 'https://e.com/3.webp' },
    { role: 'effect', url: 'https://e.com/4.webp' },
  ];
  assert.equal(lineupSchema.safeParse({ ...valid, images }).success, false);
});

test('id 非 kebab-case 被拒绝', () => {
  assert.equal(lineupSchema.safeParse({ ...valid, id: 'Ascent_Sova' }).success, false);
});
