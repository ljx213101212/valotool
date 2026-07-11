import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVlmOutput } from './vlm-parse';

test('解析合法 JSON：软字段全保留', () => {
  const { fields, warnings } = parseVlmOutput(
    JSON.stringify({ abilitySlot: 'E', technique: 'stand', origin: 'A大箱后', target: 'A点内', purpose: '探内部' }),
  );
  assert.equal(fields.abilitySlot, 'E');
  assert.equal(fields.technique, 'stand');
  assert.equal(fields.origin, 'A大箱后');
  assert.equal(fields.purpose, '探内部');
  assert.equal(warnings.length, 0);
});

test('剥 ```json 围栏', () => {
  const { fields } = parseVlmOutput('```json\n{"origin":"中路"}\n```');
  assert.equal(fields.origin, '中路');
});

test('abilitySlot 非枚举 → 丢弃 + warning，其余字段不受影响', () => {
  const { fields, warnings } = parseVlmOutput(JSON.stringify({ abilitySlot: 'Z', purpose: '封烟' }));
  assert.equal(fields.abilitySlot, undefined);
  assert.equal(fields.purpose, '封烟');
  assert.ok(warnings.some((w) => w.includes('abilitySlot')));
});

test('坏 JSON → 整体降级为空 + warning', () => {
  const { fields, warnings } = parseVlmOutput('抱歉我不确定');
  assert.deepEqual(fields, {});
  assert.ok(warnings.some((w) => w.includes('非合法 JSON')));
});

test('空字符串字段不保留', () => {
  const { fields } = parseVlmOutput(JSON.stringify({ origin: '   ', purpose: '有用途' }));
  assert.equal(fields.origin, undefined);
  assert.equal(fields.purpose, '有用途');
});
