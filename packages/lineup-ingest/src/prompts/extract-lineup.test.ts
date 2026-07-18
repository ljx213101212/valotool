import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExtractPrompt } from './extract-lineup';
import type { ExtractInput } from '../extractors/types';

const base: ExtractInput = {
  subtitleText: '',
  ocrText: [],
  images: [],
  vocab: { maps: [], agents: [] },
};

test('prompt 含枚举约束与 JSON 指令', () => {
  const p = buildExtractPrompt(base);
  assert.ok(p.includes('abilitySlot'));
  assert.ok(p.includes('C/Q/E/X'));
  assert.ok(p.includes('stand'));
  assert.ok(p.includes('JSON'));
  assert.ok(p.includes('不要编造'));
});

test('prompt 带入 map/agent/标题上下文', () => {
  const p = buildExtractPrompt({ ...base, title: '进攻a点内第一支', hints: { map: 'ascent', agent: 'sova' } });
  assert.ok(p.includes('ascent'));
  assert.ok(p.includes('sova'));
  assert.ok(p.includes('进攻a点内第一支'));
});
