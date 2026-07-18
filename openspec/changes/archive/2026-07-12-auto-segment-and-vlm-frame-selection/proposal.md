## Why

录入管线当前有两大人工瓶颈：

1. **切片依赖手抄时间轴**：`sources/*.json` 里的 `segments` 完全靠人看视频逐条记 mm:ss，一个视频几十条点位需要 10-30 分钟手抄。segment 阶段虽有章节回退接口，但 `fetch` 阶段未提取章节/字幕信息。
2. **帧指派全靠人审**：1fps 抽帧后交接触表供人审点选 stand/aim/effect，每段需手动从候选帧中点 3 张。VLM 已接入但只抽文本字段，未参与帧选择。

这两个步骤是人力的核心消耗点。消除或大幅降低它们，是把人从「创作者」真正降为「审核员」的关键。

## What Changes

### P0-1: 章节/字幕自动分段

- **fetch 阶段**：`bilibili.ts` 用 yt-dlp 提取章节信息（`--print chapters`）和下载字幕（`--write-auto-subs`），产出 `RawCapture.chapters` 和 `RawCapture.subtitlePath`。
- **segment 阶段**：新增「章节分段」和「字幕分段」两条回退路径：
  - 手抄时间轴（优先级最高，不变）
  - 章节分段：从 B 站视频元数据提取的章节点作为 segment 边界
  - 字幕分段：解析字幕文本，按语义停顿/关键词切分
- 无任何分段信息时保持现状（抛 TODO 错误）。

### P0-2: VLM 自动帧选择

- **LlmExtractor 接口扩展**：新增 `selectFrames` 方法，接收候选帧列表和 agent slug，返回 stand/aim/effect 帧的自动指派 + 置信度。
- **VlmExtractor 实现**：从候选帧中采样（最多 8 张），发送给多模态 VLM，要求其识别站位/瞄准/落点帧。
- **extract 阶段**：在文本抽取之后调用 `selectFrames`，将结果写入 `draft.frames`，作为人审的预填默认值。
- **agent-specific 帧角色**：`review-config.ts` 中新增 `required` 字段，必填帧（stand/aim/effect）为 approve 闸门条件，选填帧（agent-specific 如 Jett 的 dash_direction）为审核辅助。

## Capabilities

### Modified Capabilities

- `lineup-ingestion`：segment 阶段从「纯手抄优先级」扩展为「手抄 > 章节 > 字幕」三级回退。
- `lineup-ingestion`：extract 阶段从「VLM 只出文本」扩展为「VLM 出文本 + 帧指派」。
- `lineup-ingestion`：人审帧角色从「全手工指派」变为「VLM 预填 + 人审确认」。

### New Capabilities

- 新增 agent-specific 帧角色配置，区分必填（stand/aim/effect）与选填（agent-specific）。

## Impact

- `packages/lineup-ingest/src/adapters/bilibili.ts`：下载流程扩展，提取章节和字幕
- `packages/lineup-ingest/src/types.ts`：`RawCapture` 保持兼容，`chapters` 和 `subtitlePath` 已有字段
- `packages/lineup-ingest/src/stages/segment.ts`：新增章节/字幕分段逻辑
- `packages/lineup-ingest/src/extractors/types.ts`：`LlmExtractor` 接口新增 `selectFrames`
- `packages/lineup-ingest/src/extractors/vlm.ts`：实现 `selectFrames`
- `packages/lineup-ingest/src/extractors/mock.ts`：`selectFrames` 返回空
- `packages/lineup-ingest/src/stages/extract.ts`：调用 `selectFrames`，预填 `draft.frames`
- `packages/lineup-content/src/review-config.ts`：`FrameRoleConfig` 添加 `required` 字段
- `packages/lineup-ingest/src/review/core.ts`：`validateForApproval` 按 required 区分
- 不修改 app/小程序；不修改 Lineup schema 与 promote
