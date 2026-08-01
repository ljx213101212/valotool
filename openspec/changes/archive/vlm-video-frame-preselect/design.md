## Context

当前管线在 extract 阶段用两种方式调用 VLM：
- `extract()`：把段的接触表（多帧拼成一张大图）发给模型抽取软字段（abilitySlot/technique/origin 等）
- `selectFrames()`：从候选帧中均匀采样 5 张发给模型预选 stand/aim/effect

`selectFrames()` 的局限性已在上周验证：5 张孤立截图无时序上下文，模型在盲猜。`glm-4v-flash`/`deepseek-v4-flash` 等中低端视觉模型无法可靠区分站位/瞄准/落点。

调研结论：Gemini 2.5 Flash 视频输入能按 Jett 一突进点的 6 阶段流程精确识别时间点，成本 $0.01/视频。本设计将视频分析集成进管线，作为帧预选的主要路径，现有图像采样保留为 fallback。

## Goals / Non-Goals

**Goals:**
- 用视频输入 VLM 替代静态帧采样，提升帧预选的准确率和可靠性
- 按英雄切换 prompt 模板，对齐 `review-config.ts` 的 `frameRoles` 定义
- 视频分析失败或不可用时自动 fallback 到现有图像采样路径
- 保持人审 UI 不变，预选帧仍为可覆盖默认值
- 阶段工件幂等，重复运行不重复调 API（缓存 + 复用 clip 文件）

**Non-Goals:**
- 不替换 `extract()` 的软字段抽取（仍用接触表）
- 不替换字幕分段（仍用现有方案）
- 不修改人审 UI 或 approve 逻辑
- 不要求所有英雄一次性覆盖（先 Jett，后续按需扩展）
- 编辑页面不替代 review UI（编辑页负责触发 VLM + 产出 staging；review UI 负责人审确认）

## Decisions

### 1. 架构：新增 VideoLlmExtractor，实现 LlmExtractor 接口

**选型**：独立类 `VideoLlmExtractor`，与现有 `VlmExtractor`、`MockExtractor` 并列。

**理由**：
- `LlmExtractor` 接口已有 `selectFrames()` 方法，视频分析是其的另一种实现
- `extract()` 和 `segmentSubtitles()` 仍走现有逻辑，不耦合
- 通过 env 选择 extractor（`INGEST_EXTRACTOR=video-vlm`），与现有 `vlm`/`mock` 模式一致

**备选**：在 `VlmExtractor.selectFrames()` 里加分支判断输入类型 → 不选。职责混杂，且现有图像采样和视频分析是两种完全不同的 API 协议和 prompt 体系，分拆更清晰。

### 2. 视频裁剪：在 capture 阶段用 ffmpeg 产片段

**选型**：在 `captureFrames()` 里对每段额外产出一个 `.mp4` clip，路径 `.work/<bvid>/clips/<segmentId>.mp4`。

**理由**：
- capture 阶段已有视频路径和起止时间，无需额外参数
- 幂等检查同候选帧：已有 clip 文件则复用
- 片段时长天然受 MAX_SEC=90 限制，不会超过 Gemini inline_data 的 20MB 上限

**备选**：在 extract 阶段裁剪 → 不选。extract 应只消费工件，不应做 I/O 密集型操作。

### 3. API：Gemini 原生为主，OpenAI 兼容网关为辅

**选型**：支持两种 API 模式，通过 `GEMINI_BASE_URL` 切分。
- 直连模式：Gemini 原生 `generateContent` API + 视频 `inline_data`
- 网关模式：OpenAI 兼容 `/chat/completions`（供国内代理如 AIHubMix）

**理由**：
- Gemini 原生 API 对视频输入的支持最完善（`inline_data` + 自动抽帧 + 时序理解）
- 国内用户需走代理，网关模式用 curl + `https_proxy` 已验证可用
- 请求走 curl（非 Node.js fetch），自动走系统代理，不依赖 undici

**备选**：用 `@google/genai` SDK → 不选。增加依赖，且国内代理不走官方 SDK。

### 4. Cache：复用现有 VLM 缓存机制

**选型**：`VideoLlmExtractor` 使用同一套 SHA256（model + prompt + video 内容）哈希缓存，存入 `.work/.vlm-cache/`。

**理由**：相同视频片段 + 相同 prompt 不应该重复花钱。缓存 key 包含视频内容哈希，换 prompt 或换视频内容自动 miss。

**权衡**：视频 base64 很大（20MB），SHA256 计算耗时约 50ms，可接受。

### 5. 时间戳→候选帧映射

**选型**：Gemini 返回视频内时间 `timeSec`（0-based），映射到原视频绝对时间 `absSec = seg.startSec + timeSec`，然后 `candIdx = Math.floor(absSec - seg.startSec)`（因为候选帧是 1fps 从 seg.startSec 开始的）。

**理由**：候选帧目录里第 i 张 = 段起点后第 i 秒，索引计算精确。

**风险**：ffmpeg `-ss` 有 seek 误差。用 `-avoid_negative_ts make_zero` 可控制。

### 6. Prompt 模板组织

**选型**：`src/prompts/video-frame/<agent>.ts`，每个导出 `buildFramePrompt(title, durationSec)`。

**理由**：
- Jett 的进点流程（stand→aim→smoke→dash→landing→first_angle）和其他英雄完全不同
- `review-config.ts` 的 `agentFrameRoles` 定义了每个英雄该有哪些帧，prompt 模板理应从这里驱动
- 未来可以通过 `getAgentFrameRoles(agent)` 动态构建 prompt，实现通用模板

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| Gemini API 在国内被墙 | 走 curl + `https_proxy` 代理；网关模式（GEMINI_BASE_URL）作为备份方案 |
| 同视频跑两次 timestamp 有 ±1s 漂移 | 人审最终确认，±1s 在 22 帧中差 1 张，审核员一眼能看出 |
| 新英雄 prompt 模板质量未知 | 先 Jett 闭环验证，后续英雄参照同一结构扩展 |
| 视频片段正好卡在关键时刻边界（分段不准） | 依赖油猴 timeline 分段质量；编辑页面可选择性跳过问题段 |
| Gemini 2.5 Flash 后续降级或被替换 | prompt 用自然语言描述画面特征，不绑定模型 ID；可通过 GEMINI_MODEL env 切换 |

### 7. 编辑页面架构

**选型**：在现有 review server（端口 5180）上新增 `/edit` 路由，提供独立的编辑页面。编辑页面调用管线各阶段（fetch → capture → extract）的独立函数，而非跑完整 CLI 管线。

**理由**：
- 与 review UI 共享同一 server、同一 `workDir`、同一 staging 目录，无需新进程
- 油猴出 `SourceVideo` JSON → 编辑页面读入 → 触发 fetch + capture → 用户勾选片段 + 选英雄/prompt → 逐段调 Gemini → 写 staging
- 不需要一次性处理全部视频片段，用户可以跳过不处理的段
- 复用现有 fetch/capture/extract 的核心函数（幂等检查、候选帧裁剪），只改 UI 触发方式

**数据流**：
```
油猴 SourceVideo JSON
  → 编辑页 upload / 粘贴
  → fetch.ts (yt-dlp 下载视频)
  → capture.ts (1fps 帧 + clip 裁剪)
  → 编辑页渲染片段列表 + 预览
  → 用户勾选段、选 agent、编辑标题
  → Post: POST /api/video-analyze { segmentId, agentSlug, title }
  → VideoLlmExtractor.selectFrames()
  → 时间戳映射候选帧，写入 staging
  → 编辑页显示结果预览
  → 用户可点击跳转到 review UI 进行人审
```

**备选**：把编辑功能嵌入 review UI → 不选。review UI 职责是审核已生成的 draft，不应引入「尚未生成」的状态。两个页面独立但通过 staging JSON 衔接更清晰。

## Open Questions

- Gemini 2.5 Flash 对 Sova/Cypher 等需要更多帧角色的英雄效果如何？→ 等 Jett 闭环后再逐个测试
- 是否应该让 VLM 也做软字段抽取（`extract()`）？→ 暂不，先聚焦帧预选，接触表方案对软字段足够
- 如果 Gemini 输出格式不符合 JSON（偶尔发生），重试策略？→ 现有 VLM 有 3 次重试，复用该逻辑
