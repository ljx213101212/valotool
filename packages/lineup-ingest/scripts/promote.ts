/**
 * TODO promote：把人审通过的草稿塌缩成正式 Lineup。
 *
 * 1. 读 staging/*.json 中 reviewStatus === 'approved' 的 DraftLineup
 * 2. 补全 fields → 复用 @valotool/lineup-content 的 lineupSchema 校验（不合法打回）
 * 3. 预检 MUST_LEARN_CAP：每 {map,agent} must-learn ≤ 5，超则降档 + warning
 * 4. 按 `${map}-${agent}.json` 合并进 packages/lineup-content/data/lineups/，按 tier 排序
 * 5. 选中的帧 copy 成 raw-images/{lineupId}__{role}.png，交棒现有 ingest-images
 *
 * 之后照常： pnpm --filter @valotool/lineup-content ingest && ... check
 */
console.error('TODO promote 尚未实现');
process.exit(1);
