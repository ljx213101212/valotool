## Context

当前管线（`packages/lineup-ingest`）的能力矩阵：

| 阶段 | 输入 | 输出 | 入口 |
|------|------|------|------|
| 油猴打点 | B站视频页 | SourceJSON | `bilibili-timeline-capture.user.js`（浏览器端） |
| fetch | SourceJSON + bvid | 视频文件 + 字幕 + 章节 | `src/cli.ts run` |
| segment | RawCapture + segments[] | Segment[] | `src/cli.ts run` 内部 |
| capture | Segment[] + video | 候选帧 + 接触表 | `src/cli.ts run` 内部 |
| extract | CapturedSegment[] | DraftLineup[] | `src/cli.ts run` 内部 |
| stage | DraftLineup[] | `staging/<bvid>.json` | `src/cli.ts run` 内部 |
| review | `staging/*.json` | 人审修改写回 staging | `src/review/server.ts`（HTTP UI） |
| promote | approved DraftLineup[] | `data/lineups/<map>-<agent>.json` + webp | `src/promote/core.ts` |

所有阶段能力已就绪，但 CLI 入口脚本和 review 入口没有在 `package.json` 中暴露为直观的 npm scripts。本 change 补上这些入口别名，并记录完整流程。

## Goals / Non-Goals

**Goals:**
- 确认所有 CLI 入口已就绪（`ingest`、`review`、`promote`）
- 记录从 B站浏览到 `ascent-sova.json` 的端到端操作步骤
- 跑通一次端到端验证：油猴 SourceJSON → pipeline → 人审 → promote → 最终 JSON

**Non-Goals:**
- 不修改管线核心逻辑（所有 stage 代码不动）
- 不修改油猴工具（已可导出符合 `sourceFileSchema` 的 SourceJSON）
- 不在 TS 中新增能力或接口

## Decisions

### 1. Scripts 已就绪，无需新增

`package.json` 已含三个入口：

| script | 命令 |
|--------|------|
| `ingest` | `tsx src/cli.ts run` |
| `review` | `tsx src/review/server.ts` |
| `promote` | `tsx scripts/promote.ts` |

### 2. 流程不需要"一键脚本"

用户反馈环节中最花时间的是**人审**（从接触表选帧、补字段），这步天然需要人来做。把 fetch→stage 合为一条 `ingest` 命令已足够简洁；promote 需要人审完成后单独触发（属不同时间段的操作），不适合与前置步骤合并。

## Workflow Steps

### Step 1: 油猴端采时间轴

1. 在 Chrome 安装 `bilibili-timeline-capture.user.js`（Tampermonkey）
2. 打开 B站视频页，F9 呼出面板
3. 展开「元信息」区，填写地图、英雄（选填 UID、版本、备注）
4. 播放视频，每个点位按 F8 打点，填入标题
5. 点「📋 复制 SourceJSON」，粘贴保存为 `packages/lineup-ingest/sources/<bvid>.json`

### Step 2: 跑管线

```bash
pnpm --filter @valotool/lineup-ingest ingest sources/<bvid>.json
```

会自动下载视频（yt-dlp + browser cookies）、按时间轴切段、抽帧、VLM 预选，产出到 `staging/<bvid>.json`。

### Step 3: 人审

```bash
pnpm --filter @valotool/lineup-ingest review
```

浏览器打开 `http://localhost:5180`，逐条审核草稿：
- 查验 VLM 预选的 stand/aim/effect 帧是否正确
- 补全缺失字段（abilitySlot、tier、keywords 等）
- 点击 approve

### Step 4: 产出 meta + 上传图片

```bash
pnpm --filter @valotool/lineup-ingest promote
```

`scripts/promote.ts` 自动扫描 `staging/*.json` 中所有 approved 草稿 → `buildLineup` → 复制选中帧到 `raw-images/{id}__{role}.png` → 合并到 `data/lineups/<map>-<agent>.json`。

### Step 5: 生成 webp 并上传 CDN

```bash
CDN_BASE=<你的CDN地址> pnpm --filter @valotool/lineup-content ingest
```

将 `raw-images/` 中的 png 转为 webp，上传到 COS，更新 `data/lineups` 中的 CDN URL。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| yt-dlp 下载 B站视频需浏览器 cookie（风控 412） | 用户本地 Chrome 登录态即可；环境变量 `INGEST_COOKIES_BROWSER=chrome` 默认值已覆盖 |
| 视频下载时间长（几百 MB） | 管线限 720p，`yt-dlp` 断点续传；复用已下载工件 |
| VLM 调用有 API 费用 | 缓存相同 prompt+图片，幂等重跑不重复付费；extractor 可配置为 `mock` 跳过 |
| promote 后的图片上传需 COS 凭证 | 单独流程，独立于本 workflow |

## Open Questions

- 无——所有 CLI 入口已就绪（`ingest` / `review` / `promote`），图片上传由 `lineup-content ingest` 负责。
