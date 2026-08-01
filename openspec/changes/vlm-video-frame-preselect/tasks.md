## 1. 基础设施：视频片段工件

- [ ] 1.1 capture 阶段增加视频裁剪：`captureFrames()` 在抽帧后对每段用 ffmpeg 裁剪 `.mp4` 片段到 `<workDir>/<bvid>/clips/<segmentId>.mp4`
- [ ] 1.2 幂等检查：已有 clip 文件则跳过裁剪
- [ ] 1.3 在 `CapturedSegment` 类型中增加可选 `clipPath` 字段
- [ ] 1.4 单元测试：capture 产出 clip 文件，幂等复用

## 2. VideoLlmExtractor 核心实现

- [ ] 2.1 创建 `src/extractors/video-vlm.ts`：实现 `LlmExtractor` 接口的 `selectFrames` 方法
- [ ] 2.2 Gemini 原生 API（`generateContent` + `inline_data`）：curl 方式发送视频 base64 + prompt，解析响应
- [ ] 2.3 OpenAI 兼容网关 API（`/chat/completions`）：`image_url` 携带视频 data URI
- [ ] 2.4 `vlmConfigFromEnv()` 扩展：支持 `GEMINI_API_KEY`、`GEMINI_MODEL`、`GEMINI_BASE_URL`
- [ ] 2.5 `extractorFromEnv()` 扩展：新增 `video-vlm` 模式
- [ ] 2.6 `extract()` 和 `segmentSubtitles()` 方法委托给现有逻辑（占位实现或调用 MockExtractor）
- [ ] 2.7 单元测试：正常响应解析、JSON 非合法时的降级、HTTP 错误时的 fallback、缓存命中复用

## 3. Prompt 模板

- [ ] 3.1 创建 `src/prompts/video-frame/` 目录
- [ ] 3.2 创建 `src/prompts/video-frame/jett.ts`：Jett 一突进点 prompt，含 6 阶段画面特征、时序约束
- [ ] 3.3 创建 `src/prompts/video-frame/default.ts`：通用 stand/aim/effect prompt（fallback 模板）
- [ ] 3.4 prompt 构建函数接收 `title`、`durationSec`、`agentSlug` 参数
- [ ] 3.5 单元测试：prompt 包含所有角色的特征描述，未知 agent 回退默认模板

## 4. extract 阶段集成

- [ ] 4.1 `FrameSelectionInput` 类型增加可选 `videoPath` 字段
- [ ] 4.2 `extract()` 函数：优先调 `VideoLlmExtractor.selectFrames()`，失败/不可用时 fallback 到现有逻辑
- [ ] 4.3 时间戳→候选帧映射逻辑（`absSec = startSec + timeSec`，映射到 `candIdx`）
- [ ] 4.4 单元测试：视频路径传入时走 video 路径，无视频时走图像采样路径

## 5. 缓存

- [ ] 5.1 VideoLlmExtractor 复用现有 SHA256 缓存（model + prompt + video content 哈希）
- [ ] 5.2 缓存文件存入 `.work/.vlm-cache/`
- [ ] 5.3 单元测试：缓存命中跳过 API 调用

## 6. 课程与端到端验证

- [ ] 6.1 用 BV1Z1Mw6ZEhx 跑 Jett 完整管线，验证 video-vlm 模式产出帧预选
- [ ] 6.2 对比 video-vlm 和现有 image-vlm 的预选结果质量
- [ ] 6.3 验证 fallback 路径：断网关掉 GEMINI_API_KEY 后仍跑通管线
- [ ] 6.4 记录 eval 数据：Gemini 预选 vs 人审 ground truth 的帧命中率

## 7. 编辑页面 + 主页入口

- [ ] 7.1 创建 `src/features/video-ingest/VideoIngestPage.tsx`：编辑页面 UI（上传区 + 片段列表 + agent/prompt 选择 + 标题编辑 + 生成按钮 + 结果预览）
- [ ] 7.2 创建 `src/review/edit-core.ts`：编辑页面核心逻辑（解析 SourceVideo JSON、调用 fetch/capture、逐段调 Gemini、写入 staging）
- [ ] 7.3 review server 新增 API 端点：`POST /api/source-video`（fetch+capture）、`POST /api/video-analyze`（Gemini 分析）、`GET /api/video-analyze/clips/:bvid`（查 clip 列表）
- [ ] 7.4 油猴插件产出的 SourceVideo JSON 上传/粘贴解析
- [ ] 7.5 片段列表渲染：显示每段时长、候选帧数、缩略图预览
- [ ] 7.6 按段选择英雄（AGENTS 注册表下拉）和 prompt 模板（自动匹配 agentFrameRoles）
- [ ] 7.7 段标题可编辑，默认使用 segment title
- [ ] 7.8 「生成」按钮：对选中的段逐段调用 Gemini，显示进度，某段失败不影响其他段
- [ ] 7.9 生成结果预览：显示各帧角色的缩略图和描述
- [ ] 7.10 跳转链接：生成完成后可点击跳转到 review UI 对应 draft
- [ ] 7.11 在 `src/main.tsx` 添加 `/video-ingest` 路由
- [ ] 7.12 在 `MatchListPage.tsx` 主页添加「视频点位录入 →」入口链接
