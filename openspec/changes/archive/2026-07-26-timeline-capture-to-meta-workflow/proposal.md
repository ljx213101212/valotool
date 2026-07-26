## Why

现有管线支持 SourceJSON → pipeline → staging → 人审 → promote 的端到端链路，但缺少一份**从 B站视频浏览到最终 meta JSON 的完整操作说明**。用户在 B站用油猴 `bilibili-timeline-capture.user.js` 打完时间点后，不清楚如何继续推进到最终产物（如 `data/lineups/ascent-sova.json`）。需记录本流程并补齐 CLI 入口的轻微断层。

## What Changes

- 记录「油猴采时间轴 → SourceJSON → CLI 跑管线 → review UI 人审 → promote 产出 meta → webp 上传 CDN」的 5 步端到端流程。
- 所有 CLI 入口已就绪（`ingest`、`review`、`promote`），油猴导出的 SourceJSON 与 pipeline 输入已是同一契约（`sourceFileSchema`）——本 change 是一次**流程文档化**，无代码变更。

## Capabilities

### New Capabilities

- 无 new capability——所有阶段能力已就绪，本 change 仅记录端到端操作流程。

### Modified Capabilities

- 无 modified capability——所有阶段能力与 CLI 入口已就绪。

## Impact

- `packages/lineup-ingest/package.json`：三个 scripts（`ingest`、`review`、`promote`）已就绪，无需修改。
- `packages/lineup-ingest/scripts/promote.ts`：promote CLI 入口已存在，扫描 staging 中所有 approved 草稿 → buildLineup → 复制帧 → 合并到 `data/lineups/<map>-<agent>.json`。
- 图片上传由 `lineup-content ingest`（`scripts/ingest-images.ts`）负责：png→webp + COS 上传。
- 无需修改管线核心代码。
