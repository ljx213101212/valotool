import test from 'node:test';
import assert from 'node:assert/strict';
import { parseChaptersFromSubtitleText } from './subtitle';

test('VTT 字幕解析：按停顿切分章节', () => {
  const vtt = `WEBVTT

00:00:05.000 --> 00:00:08.000
进攻a点内第一支

00:00:08.500 --> 00:00:12.000
站在这个墙角

00:00:25.000 --> 00:00:28.000
防守b点箭

00:00:29.000 --> 00:00:33.000
瞄这个位置`;
  const chs = parseChaptersFromSubtitleText(vtt, 60);
  // 5s-12s 是第一段(连在一起,短停顿) → ~5-12
  // 25s-33s 是第二段(有 13s 长停顿) → ~25-33
  assert.ok(chs.length >= 1, `期望至少 1 章，实际 ${chs.length}`);
  assert.ok(chs[0].startSec <= 10, `第一段起应在 10s 内，实际 ${chs[0].startSec}`);
  assert.ok(chs[chs.length - 1].endSec >= 25, `最后段尾应在 25s 后`);
});

test('空字幕返回空数组', () => {
  const chs = parseChaptersFromSubtitleText('', 60);
  assert.equal(chs.length, 0);
});

test('单条字幕成一段', () => {
  const vtt = `WEBVTT

00:00:10.000 --> 00:00:15.000
单条字幕测试`;
  const chs = parseChaptersFromSubtitleText(vtt, 60);
  assert.equal(chs.length, 1);
  assert.equal(chs[0].startSec, 10);
  assert.equal(chs[0].endSec, 15);
  assert.equal(chs[0].title, '单条字幕测试');
});

test('短停顿合并：2s 内相邻字幕归入同一段，长停顿分裂', () => {
  const vtt = `WEBVTT

00:00:10.000 --> 00:00:12.000
第一句

00:00:13.000 --> 00:00:15.000
第二句

00:00:35.000 --> 00:00:40.000
第三句(长停顿后)`;
  const chs = parseChaptersFromSubtitleText(vtt, 60);
  assert.equal(chs.length, 2, `前两条合并，第三条独立，实际 ${chs.length}`);
  assert.ok(chs[0].startSec <= 10 && chs[0].endSec >= 15, `第一段跨前两句，实际 [${chs[0].startSec}, ${chs[0].endSec}]`);
  assert.ok(chs[1].startSec >= 35, `第二段从 35s 起，实际 ${chs[1].startSec}`);
});

test('段超过最大时长时截断', () => {
  // 制造 2 条跨度超过 30s 的字幕
  const vtt = `WEBVTT

00:00:00.000 --> 00:00:05.000
开头

00:00:40.000 --> 00:00:45.000
40秒后`;
  const chs = parseChaptersFromSubtitleText(vtt, 90);
  // 0-5 和 40-45，中间 > 15s 就该断开
  assert.equal(chs.length, 2);
});
