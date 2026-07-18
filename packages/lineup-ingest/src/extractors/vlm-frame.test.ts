import test from 'node:test';
import assert from 'node:assert/strict';
import { VlmExtractor } from './vlm';
import type { FrameSelectionInput } from './types';
import type { FrameCandidate } from '../types';

function candidates(n: number): FrameCandidate[] {
  return Array.from({ length: n }, (_, i) => ({
    path: `c${String(i + 1).padStart(3, '0')}.png`,
    atSec: 10 + i,
  }));
}

function extractor(stub: typeof fetch) {
  return new VlmExtractor({
    baseUrl: 'https://api.deepseek.com',
    apiKey: 'k',
    model: 'deepseek-v4-flash',
    fetchImpl: stub,
    readImage: async () => 'BASE64',
  });
}

test('selectFrames: 请求结构含采样帧 + prompt', async () => {
  let seenBody: any;
  const stub = (async (_url: string, init: any) => {
    seenBody = JSON.parse(init.body);
    return new Response(
      JSON.stringify({ choices: [{ message: { content: '{"stand":1,"aim":2,"effect":3}' } }] }),
      { status: 200 },
    );
  }) as unknown as typeof fetch;

  const input: FrameSelectionInput = {
    candidates: candidates(10), // MAX_IMAGES=5, step=2 → sampled [0,2,4,6,9]
    title: '进攻a点内第一支',
    agentSlug: 'sova',
  };
  const r = await extractor(stub).selectFrames(input);
  assert.equal(seenBody.model, 'deepseek-v4-flash');
  const parts = seenBody.messages[0].content;
  const imgs = parts.filter((p: any) => p.type === 'image_url');
  assert.ok(imgs.length <= 5, `最多 5 张图，实际 ${imgs.length}`);
  assert.equal(r.selections.length, 3);
});

test('selectFrames: 成功响应映射为帧路径（1-based 编号）', async () => {
  const stub = (async () => {
    return new Response(
      // 8 candidates, MAX_IMAGES=5, step=1 → sampled [0,1,2,3,7]
      // 1-based: seq 1→idx 0=c001, seq 2→idx 1=c002, seq 3→idx 2=c003, seq 4→idx 3=c004, seq 5→idx 7=c008
      JSON.stringify({ choices: [{ message: { content: '{"stand":1,"aim":3,"effect":5}' } }] }),
      { status: 200 },
    );
  }) as unknown as typeof fetch;

  const inp: FrameSelectionInput = {
    candidates: candidates(8),
    title: '防守b点箭',
    agentSlug: 'sova',
  };
  const r = await extractor(stub).selectFrames(inp);
  assert.equal(r.selections.length, 3);
  assert.equal(r.selections[0].role, 'stand');
  assert.equal(r.selections[0].framePath, 'c001.png');   // seq 1 → idx 0
  assert.equal(r.selections[1].role, 'aim');
  assert.equal(r.selections[1].framePath, 'c003.png');    // seq 3 → idx 2
  assert.equal(r.selections[2].role, 'effect');
  assert.equal(r.selections[2].framePath, 'c008.png');    // seq 5 → idx 7
});

test('selectFrames: 超范围/非法索引被静默跳过', async () => {
  const stub = (async () => {
    // 0 → ≤0 被跳过, 99 → > sampled.length 被跳过, 3 → 有效
    return new Response(
      JSON.stringify({ choices: [{ message: { content: '{"stand":0,"aim":99,"effect":3}' } }] }),
      { status: 200 },
    );
  }) as unknown as typeof fetch;

  const inp: FrameSelectionInput = {
    candidates: candidates(10),
    title: 'test',
    agentSlug: 'sova',
  };
  const r = await extractor(stub).selectFrames(inp);
  assert.equal(r.selections.length, 1, `只有 effect seq 3 有效，实际 ${r.selections.length}`);
});

test('selectFrames: VLM 坏 JSON → 空帧 + warning', async () => {
  const stub = (async () => {
    return new Response(
      JSON.stringify({ choices: [{ message: { content: 'not json' } }] }),
      { status: 200 },
    );
  }) as unknown as typeof fetch;

  const input: FrameSelectionInput = {
    candidates: candidates(10),
    title: 'test',
    agentSlug: 'sova',
  };
  const r = await extractor(stub).selectFrames(input);
  assert.deepEqual(r.selections, []);
  assert.equal(r.confidence, 0);
  assert.ok(r.warnings.length >= 1);
});

test('selectFrames: HTTP 错误降级', async () => {
  const stub = (async () => new Response('busy', { status: 500 })) as unknown as typeof fetch;
  const input: FrameSelectionInput = {
    candidates: candidates(10),
    title: 'test',
    agentSlug: 'sova',
  };
  const r = await extractor(stub).selectFrames(input);
  assert.deepEqual(r.selections, []);
  assert.equal(r.confidence, 0);
});

test('selectFrames: 候选帧少（≤ 采样数）时全量发送', async () => {
  let seenBody: any;
  const stub = (async (_url: string, init: any) => {
    seenBody = JSON.parse(init.body);
    return new Response(
      // 5 candidates → all sampled → idx [0,1,2,3,4]
      // seq 1→c001, seq 2→c002, seq 3→c003
      JSON.stringify({ choices: [{ message: { content: '{"stand":1,"aim":2,"effect":3}' } }] }),
      { status: 200 },
    );
  }) as unknown as typeof fetch;

  const smallInput: FrameSelectionInput = {
    candidates: candidates(5),
    title: 'test',
    agentSlug: 'sova',
  };
  const r = await extractor(stub).selectFrames(smallInput);
  const imgs = seenBody.messages[0].content.filter((p: any) => p.type === 'image_url');
  assert.equal(imgs.length, 5);
  assert.equal(r.selections.length, 3);
});
