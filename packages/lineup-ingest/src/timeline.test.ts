import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTimeline } from './timeline';

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
