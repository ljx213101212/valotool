import test from 'node:test';
import assert from 'node:assert/strict';
import { VlmExtractor } from './vlm';

function extractor(stub: typeof fetch) {
  return new VlmExtractor({
    baseUrl: 'https://api.deepseek.com',
    apiKey: 'k',
    model: 'deepseek-v4-flash',
    fetchImpl: stub,
    readImage: async () => 'BASE64',
  });
}

const SUBTITLE_TEXT = `1
00:00:01,000 --> 00:00:05,000
欢迎来到教学

2
00:00:17,000 --> 00:00:20,000
第一种我们飞包点

3
00:00:38,000 --> 00:00:42,000
第二种飞左边箱子

4
00:00:54,000 --> 00:00:58,000
B点第一种飞包点`;

test('segmentSubtitles: 成功解析 VLM 返回的段边界', async () => {
  const stub = (async () => {
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: '[{"startSec":1,"title":"开场"},{"startSec":17,"title":"A点第一种"},{"startSec":38,"title":"A点第二种"},{"startSec":54,"title":"B点第一种"}]' } }],
      }),
      { status: 200 },
    );
  }) as unknown as typeof fetch;

  const r = await extractor(stub).segmentSubtitles(SUBTITLE_TEXT, 96);
  assert.equal(r.segments.length, 4);
  assert.equal(r.segments[0].startSec, 1);
  assert.equal(r.segments[0].endSec, 17);
  assert.equal(r.segments[1].startSec, 17);
  assert.equal(r.segments[1].endSec, 38);
  assert.equal(r.segments[3].title, 'B点第一种');
  assert.equal(r.segments[3].endSec, 96, '末段 endSec 应为视频时长');
});

test('segmentSubtitles: 单段视频 → 一条 segment', async () => {
  const stub = (async () => {
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: '[{"startSec":0,"title":"唯一教学"}]' } }],
      }),
      { status: 200 },
    );
  }) as unknown as typeof fetch;

  const r = await extractor(stub).segmentSubtitles('short text', 30);
  assert.equal(r.segments.length, 1);
  assert.equal(r.segments[0].endSec, 30);
});

test('segmentSubtitles: VLM 坏 JSON → 空段 + warning', async () => {
  const stub = (async () => {
    return new Response(
      JSON.stringify({ choices: [{ message: { content: 'not json' } }] }),
      { status: 200 },
    );
  }) as unknown as typeof fetch;

  const r = await extractor(stub).segmentSubtitles(SUBTITLE_TEXT, 96);
  assert.equal(r.segments.length, 0);
  assert.ok(r.warnings.length >= 1);
});

test('segmentSubtitles: HTTP 错误不抛', async () => {
  const stub = (async () => new Response('err', { status: 500 })) as unknown as typeof fetch;
  const r = await extractor(stub).segmentSubtitles(SUBTITLE_TEXT, 96);
  assert.equal(r.segments.length, 0);
});
