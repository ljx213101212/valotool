import test from 'node:test';
import assert from 'node:assert/strict';
import { segment } from './segment';
import { MockExtractor } from '../extractors/mock';
import type { ManualSegment, RawCapture, SourceVideo } from '../types';

const ctx = { workDir: '', extractor: new MockExtractor(), log: () => {} };

function cap(segments: ManualSegment[] | undefined, durationSec: number): RawCapture {
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
  return { source, videoPath: 'v.mp4', chapters: [], durationSec };
}

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

test('无手抄时间轴且无章节：抛错（自动检测未实现）', async () => {
  await assert.rejects(() => segment(cap(undefined, 100), ctx));
});
