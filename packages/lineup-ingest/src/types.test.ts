import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceFileSchema, sourceVideoSchema } from './types';

const valid = {
  id: 'BV1Tz4y1e7NK',
  platform: 'bilibili',
  url: 'https://www.bilibili.com/video/BV1Tz4y1e7NK',
  title: 't',
  creator: 'c',
  credit: 'cr',
};

test('合法 source 通过', () => {
  assert.equal(sourceVideoSchema.safeParse(valid).success, true);
});

test('非法 bvid 被拒', () => {
  assert.equal(sourceVideoSchema.safeParse({ ...valid, id: 'XX123' }).success, false);
});

test('缺 credit 被拒', () => {
  const { credit, ...noCredit } = valid;
  void credit;
  assert.equal(sourceVideoSchema.safeParse(noCredit).success, false);
});

test('platform 非 bilibili 被拒', () => {
  assert.equal(sourceVideoSchema.safeParse({ ...valid, platform: 'youtube' }).success, false);
});

test('sourceFileSchema 接受 source 数组', () => {
  assert.equal(sourceFileSchema.safeParse([valid]).success, true);
});
