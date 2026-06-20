import test from 'node:test';
import assert from 'node:assert/strict';
import { extract } from './extract';
import { MockExtractor } from '../extractors/mock';
import type { CapturedSegment, SourceVideo } from '../types';

const src: SourceVideo = {
  id: 'BV1Tz4y1e7NK',
  platform: 'bilibili',
  url: 'https://www.bilibili.com/video/BV1Tz4y1e7NK',
  title: 't',
  creator: '无敌猎枭王',
  credit: 'cr',
  hints: { map: 'ascent', agent: 'sova' },
  recordedPatch: '12.11',
};
const ctx = { workDir: '', extractor: new MockExtractor(), log: () => {} };

function seg(title: string): CapturedSegment {
  return {
    videoId: src.id,
    segmentId: `${src.id}-0`,
    startSec: 22,
    endSec: 60,
    title,
    subtitleText: '',
    candidates: [],
  };
}

test('标题含攻防+站点 → parseQuery 确定性抽 side/site，并带 hints/溯源', async () => {
  const d = await extract(seg('进攻a点内第一支'), src, ctx);
  assert.equal(d.fields.side, 'attack');
  assert.equal(d.fields.site, 'A');
  assert.equal(d.fields.map, 'ascent');
  assert.equal(d.fields.agent, 'sova');
  assert.equal(d.fields.verifiedPatch, '12.11');
  assert.equal(d.provenance.creator, '无敌猎枭王');
  assert.equal(d.provenance.startSec, 22);
  assert.equal(d.reviewStatus, 'pending');
  assert.deepEqual(d.frames, {}, '三帧不在抽取阶段指派');
});

test('标题无攻防字样 → warning 标注未能确定 side，不臆造', async () => {
  const d = await extract(seg('a二楼上看二楼下'), src, ctx);
  assert.equal(d.fields.side, undefined);
  assert.ok(d.warnings.some((w) => w.includes('未能从标题确定 side')));
});
