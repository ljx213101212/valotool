import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { segment } from './segment';
import { MockExtractor } from '../extractors/mock';
import type { Chapter, ManualSegment, RawCapture, SourceVideo } from '../types';

const ctx = { workDir: '', extractor: new MockExtractor(), log: () => {} };

function cap(segments: ManualSegment[] | undefined, durationSec: number, opts?: { chapters?: Chapter[]; subtitlePath?: string }): RawCapture {
  const source: SourceVideo = {
    id: 'BV1Tz4y1e7NK',
    platform: 'bilibili',
    url: 'https://www.bilibili.com/video/BV1Tz4y1e7NK',
    title: 't',
    creator: 'c',
    credit: 'cr',
    hints: { map: 'ascent', agent: 'sova' },
    segments,
  };
  return {
    source,
    videoPath: 'v.mp4',
    chapters: opts?.chapters ?? [],
    subtitlePath: opts?.subtitlePath,
    durationSec,
  };
}

test('手抄时间轴优先：即使有章节也不触发回退', async () => {
  const segs = await segment(
    cap([{ startSec: 22, title: 'A' }, { startSec: 60, title: 'B' }], 120, {
      chapters: [{ index: 0, startSec: 10, endSec: 30, title: 'chapter1' }],
    }),
    ctx,
  );
  assert.equal(segs.length, 2);
  assert.equal(segs[0].title, 'A'); // 手抄优先
});

test('手抄时间轴切片：N 段、endSec 由下一段推、末段取时长', async () => {
  const segs = await segment(
    cap([
      { startSec: 22, title: 'A' },
      { startSec: 60, title: 'B' },
      { startSec: 80, title: 'C' },
    ], 120),
    ctx,
  );
  assert.equal(segs.length, 3);
  assert.deepEqual(
    segs.map((s) => [s.startSec, s.endSec]),
    [[22, 60], [60, 80], [80, 120]],
  );
  assert.equal(segs[0].segmentId, 'BV1Tz4y1e7NK-0');
  assert.equal(segs[2].title, 'C');
});

test('无手抄时回退到章节信息', async () => {
  const segs = await segment(
    cap(undefined, 200, {
      chapters: [
        { index: 0, startSec: 10, endSec: 50, title: '第一段' },
        { index: 1, startSec: 50, endSec: 100, title: '第二段' },
      ],
    }),
    ctx,
  );
  assert.equal(segs.length, 2);
  assert.equal(segs[0].startSec, 10);
  assert.equal(segs[0].endSec, 50);
  assert.equal(segs[0].title, '第一段');
  assert.equal(segs[1].startSec, 50);
  assert.equal(segs[1].endSec, 100);
});

test('无手抄无章节时回退到字幕自动分段', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'segtest-'));
  const subPath = join(dir, 'subs.zh-Hans.vtt');
  const vtt = `WEBVTT

00:00:05.000 --> 00:00:08.000
进攻a点箭

00:00:30.000 --> 00:00:33.000
防守b点箭`;
  await writeFile(subPath, vtt);

  try {
    const segs = await segment(cap(undefined, 60, { subtitlePath: subPath }), ctx);
    assert.ok(segs.length >= 1, `期望至少 1 段，实际 ${segs.length}`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('无任何分段信息时抛错', async () => {
  await assert.rejects(() => segment(cap(undefined, 100), ctx));
});

test('字幕连续无停顿 → gap 分段质量差 → VLM 兜底失败 → 回退 gap 结果', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'segtest-'));
  const subPath = join(dir, 'subs.ai-zh.srt');
  const srt = `1
00:00:01,000 --> 00:00:05,000
开始

2
00:00:17,000 --> 00:00:20,000
第一种介绍

3
00:00:40,000 --> 00:00:44,000
第二种介绍`;
  await writeFile(subPath, srt);

  try {
    // MockExtractor.segmentSubtitles 返回空 → 回退到 gap 分段结果
    const segs = await segment(cap(undefined, 96, { subtitlePath: subPath }), ctx);
    assert.ok(segs.length >= 1, `VLM 失败应回退 gap 结果，实际 ${segs.length} 段`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
