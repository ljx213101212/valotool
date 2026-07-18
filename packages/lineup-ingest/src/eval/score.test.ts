import test from 'node:test';
import assert from 'node:assert/strict';
import { categoricalAccuracy, compareFields } from './score';

test('compareFields：类别字段判命中，自由文本不判', () => {
  const rows = compareFields(
    { abilitySlot: 'E', technique: 'stand', origin: 'A大' },
    { abilitySlot: 'E', technique: 'jump-throw', origin: 'A小' },
  );
  assert.equal(rows.find((r) => r.field === 'abilitySlot')?.hit, true);
  assert.equal(rows.find((r) => r.field === 'technique')?.hit, false);
  assert.equal(rows.find((r) => r.field === 'origin')?.hit, undefined);
});

test('categoricalAccuracy：聚合命中率，无 ground truth 不计', () => {
  const r1 = compareFields({ abilitySlot: 'E', technique: 'stand' }, { abilitySlot: 'E', technique: 'stand' });
  const r2 = compareFields({ abilitySlot: 'Q', technique: 'stand' }, { abilitySlot: 'E', technique: 'stand' });
  const r3 = compareFields({ technique: 'stand' }, { abilitySlot: 'E', technique: 'stand' }); // abilitySlot 无真值
  const acc = categoricalAccuracy([r1, r2, r3]);
  assert.deepEqual(acc.find((a) => a.field === 'abilitySlot'), { field: 'abilitySlot', hit: 1, total: 2 });
  assert.deepEqual(acc.find((a) => a.field === 'technique'), { field: 'technique', hit: 3, total: 3 });
});
