## Why

当前管线用静态帧图片（接触表 + 5 帧采样）给 VLM 做帧预选，结果不可靠——不同段落的选帧答案相同、模型在盲猜。根因是**缺少时序上下文**：站位→瞄准→技能释放→落点的标准/aim/effect 本质是时间先后关系，静态图无法捕捉。Gemini 2.5 Flash 视频输入测试验证了：给定完整视频片段，VLM 能按 Jett 一突进点流程，精确识别 6 个阶段的时间点。

## What Changes

- 新增 `video-frame-preselect` 能力：用视频输入的大模型（Gemini 2.5 Flash / 后续可换）替代「接触表 + 5 帧采样」的静态帧预选方式，把视频片段直接发给 VLM，由模型从时序画面中识别各阶段帧。
- 修改 `lineup-ingestion` 的 extract 阶段：增加视频分析提取器（VideoLlmExtractor），与现有图像分析提取器并存，按英雄切换 prompt 模板。
- 新增**编辑页面**：衔接油猴插件产出的 timeline JSON，提供交互界面用于：① 选择要处理的视频片段 ② 按片段选择英雄和 prompt 模板 ③ 编辑段标题 ④ 点击「生成」触发 Gemini 视频分析，产出帧预选并写入 `staging/<bvid>.json`。
- 油猴插件产出标准 `SourceVideo` JSON（含 segments + hints）作为管线输入，跳过手抄 `_timeline.txt` 步骤。
- 每个英雄产出专属帧预选 prompt 模板（对齐 `review-config.ts` 的 `agentFrameRoles`），现阶段覆盖 Jett。
- 人审流程不变：VLM 预选帧仍为默认值，人审可覆盖。

## Capabilities

### New Capabilities

- `video-frame-preselect`：将游戏视频片段直接输入多模态 VLM，按英雄特定的时序流程识别站位、瞄准、技能释放、落点等关键帧，输出时间戳映射到候选帧作为预选结果。

### Modified Capabilities

- `lineup-ingestion`：extract 阶段新增基于视频分析的提取策略。`selectFrames` 方法新增视频输入路径（`FrameSelectionInput` 增加可选 `videoPath` 字段），现有图像采样路径保留为 fallback。取帧阶段新增视频片段截取工件。

## Impact

- 新增提取器：`src/extractors/video-vlm.ts`（Gemini 视频分析 + OpenAI 兼容网关双模式）
- 新增 prompt 模板目录：`src/prompts/video-frame/`（按英雄拆分）
- 新增编辑页面：`src/review/edit.html` + `src/review/edit-core.ts`（内嵌于 review server）
- 修改 `src/extractors/types.ts`：`FrameSelectionInput` 增加可选 `videoPath`
- 修改 `src/stages/capture.ts`：对每段额外截取视频片段作为工件
- 修改 `src/stages/extract.ts`：优先调视频 extractor，fallback 到现有图像采样
- 新增依赖：无（直接用 fetch/curl 调 Gemini API 或 OpenAI 兼容网关）
- 管线新增产物：`.work/<bvid>/clips/<segmentId>.mp4`
- 油猴插件新增输出格式：与 `SourceVideo` 兼容的标准 JSON
