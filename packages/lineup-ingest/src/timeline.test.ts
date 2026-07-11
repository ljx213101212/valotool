import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBilibiliTimelineSource, parseTimeline, parseTimelineCliArgs } from './timeline';

test('mm:ss 基本解析 + 秒换算', () => {
  const { segments } = parseTimeline('0:22 进攻a点内第一支\n1:00 进攻a点内第二支\n13:44 a二楼下看二楼上');
  assert.deepEqual(segments, [
    { startSec: 22, title: '进攻a点内第一支' },
    { startSec: 60, title: '进攻a点内第二支' },
    { startSec: 824, title: 'a二楼下看二楼上' },
  ]);
});

test('h:mm:ss 与多种分隔符', () => {
  const { segments } = parseTimeline('1:02:03 - 甲\n2:05.乙\n3:10、丙');
  assert.deepEqual(segments, [
    { startSec: 3723, title: '甲' },
    { startSec: 125, title: '乙' },
    { startSec: 190, title: '丙' },
  ]);
});

test('无时间戳的行进 skipped，空行忽略', () => {
  const { segments, skipped } = parseTimeline('随便一句话\n\n1:05 有效\n谢谢观看');
  assert.equal(segments.length, 1);
  assert.equal(segments[0].startSec, 65);
  assert.deepEqual(skipped, ['随便一句话', '谢谢观看']);
});

test('只有时间没标题也保留（title 空）', () => {
  const { segments } = parseTimeline('0:30');
  assert.deepEqual(segments, [{ startSec: 30, title: '' }]);
});

test('完整来源输出可直接作为 ingest 输入，URL 与致谢由 BVID 生成', () => {
  const sources = buildBilibiliTimelineSource('0:12 A包点进点 - 飞箱上\n0:34 A包点进点 - 飞点内', {
    bvid: 'BV1Tz4y1e7NK',
    title: '捷风 Ascent 进点合集',
    creator: '测试 UP',
    creatorUid: '107743511',
    map: 'ascent',
    agent: 'jett',
    recordedPatch: '12.11',
    note: '录入测试',
  });

  assert.deepEqual(sources, [{
    id: 'BV1Tz4y1e7NK',
    platform: 'bilibili',
    url: 'https://www.bilibili.com/video/BV1Tz4y1e7NK',
    title: '捷风 Ascent 进点合集',
    creator: '测试 UP',
    creatorUid: '107743511',
    recordedPatch: '12.11',
    hints: { map: 'ascent', agent: 'jett' },
    credit: '点位演示来源：B站 @测试 UP（uid 107743511，BV1Tz4y1e7NK）',
    note: '录入测试',
    segments: [
      { startSec: 12, title: 'A包点进点 - 飞箱上' },
      { startSec: 34, title: 'A包点进点 - 飞点内' },
    ],
  }]);
});

test('完整来源拒绝无效 BVID 与空的必填元数据', () => {
  assert.throws(
    () => buildBilibiliTimelineSource('0:12 A包点进点', {
      bvid: 'not-a-bvid',
      title: '捷风 Ascent 进点合集',
      creator: '测试 UP',
      map: 'ascent',
      agent: 'jett',
    }),
    /id 须为 B 站 bvid/,
  );
  assert.throws(
    () => buildBilibiliTimelineSource('0:12 A包点进点', {
      bvid: 'BV0000000000',
      title: '捷风 Ascent 进点合集',
      creator: '测试 UP',
      map: 'ascent',
      agent: 'jett',
    }),
    /全零占位符/,
  );
  assert.throws(
    () => buildBilibiliTimelineSource('0:12 A包点进点', {
      bvid: 'BV1Tz4y1e7NK',
      title: '',
      creator: '测试 UP',
      map: 'ascent',
      agent: 'jett',
    }),
    /缺少必填元数据: title/,
  );
});

test('完整来源模式解析元数据参数，纯模式保留文件参数', () => {
  assert.deepEqual(parseTimelineCliArgs(['draft.txt']), { timelinePath: 'draft.txt' });
  assert.deepEqual(parseTimelineCliArgs([
    'jett.txt', '--source', '--bvid', 'BV1Tz4y1e7NK', '--title', '捷风 Ascent 进点合集',
    '--creator', '测试 UP', '--creator-uid', '107743511', '--map', 'ascent', '--agent', 'jett',
    '--patch', '12.11', '--note', '录入测试',
  ]), {
    timelinePath: 'jett.txt',
    source: {
      bvid: 'BV1Tz4y1e7NK', title: '捷风 Ascent 进点合集', creator: '测试 UP', creatorUid: '107743511',
      map: 'ascent', agent: 'jett', recordedPatch: '12.11', note: '录入测试',
    },
  });
  assert.throws(() => parseTimelineCliArgs(['--bvid', 'BV1Tz4y1e7NK']), /--source/);
});

test('--output 与 -o 解析输出路径', () => {
  assert.deepEqual(parseTimelineCliArgs(['draft.txt', '--output', 'out.json']), {
    timelinePath: 'draft.txt', outputPath: 'out.json',
  });
  assert.deepEqual(parseTimelineCliArgs(['draft.txt', '-o', 'out.json']), {
    timelinePath: 'draft.txt', outputPath: 'out.json',
  });
  assert.deepEqual(parseTimelineCliArgs(['-o', 'out.json']), {
    timelinePath: undefined, outputPath: 'out.json',
  });
  assert.throws(() => parseTimelineCliArgs(['--output']), /需要一个文件路径/);
  assert.throws(() => parseTimelineCliArgs(['-o', '--source', 'draft.txt']), /需要一个文件路径/);
});

test('--output 可与 --source 共存', () => {
  assert.deepEqual(parseTimelineCliArgs([
    'jett.txt', '--source', '--bvid', 'BV1Tz4y1e7NK', '--title', '捷风 Ascent 进点合集',
    '--creator', '测试 UP', '--map', 'ascent', '--agent', 'jett',
    '--output', 'out.json',
  ]), {
    timelinePath: 'jett.txt',
    outputPath: 'out.json',
    source: {
      bvid: 'BV1Tz4y1e7NK', title: '捷风 Ascent 进点合集', creator: '测试 UP',
      map: 'ascent', agent: 'jett',
    },
  });
});
