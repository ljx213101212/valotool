import test from 'node:test';
import assert from 'node:assert/strict';
import { VlmExtractor } from './vlm';
import type { ExtractInput } from './types';

const input: ExtractInput = {
  title: '进攻a点内第一支',
  subtitleText: '',
  ocrText: [],
  images: ['contact.png'],
  hints: { map: 'ascent', agent: 'sova' },
  vocab: { maps: ['ascent'], agents: ['sova'] },
};

function extractor(stub: typeof fetch) {
  return new VlmExtractor({
    baseUrl: 'https://api.deepseek.com',
    apiKey: 'k',
    model: 'deepseek-v4-flash',
    fetchImpl: stub,
    readImage: async () => 'BASE64',
  });
}

test('请求结构正确：含 model、文字 + 图像 content', async () => {
  let seenBody: any;
  const stub = (async (_url: string, init: any) => {
    seenBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"abilitySlot":"E","origin":"A大箱后"}' } }] }), { status: 200 });
  }) as unknown as typeof fetch;

  const r = await extractor(stub).extract(input);
  assert.equal(seenBody.model, 'deepseek-v4-flash');
  const parts = seenBody.messages[0].content;
  assert.ok(parts.some((p: any) => p.type === 'text'));
  const img = parts.find((p: any) => p.type === 'image_url');
  assert.ok(img && img.image_url.url.startsWith('data:image/png;base64,BASE64'));
  assert.equal(r.fields.abilitySlot, 'E');
  assert.equal(r.fields.origin, 'A大箱后');
});

test('非 200 → 降级为空 + warning，不抛', async () => {
  const stub = (async () => new Response('boom', { status: 500 })) as unknown as typeof fetch;
  const r = await extractor(stub).extract(input);
  assert.deepEqual(r.fields, {});
  assert.equal(r.confidence, 0);
  assert.ok(r.warnings.some((w) => w.includes('HTTP 500')));
});

test('网络异常 → 降级 + warning，不抛', async () => {
  const stub = (async () => {
    throw new Error('ECONNREFUSED');
  }) as unknown as typeof fetch;
  const r = await extractor(stub).extract(input);
  assert.deepEqual(r.fields, {});
  assert.ok(r.warnings.some((w) => w.includes('请求失败')));
});
