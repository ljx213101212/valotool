## ADDED Requirements

### Requirement: 视频片段截取与工件管理

系统 SHALL 在 capture 阶段为每段额外生成视频片段工件（`<workDir>/<bvid>/clips/<segmentId>.mp4`），片段起止时间与该段候选帧一致。已有片段文件时 SHALL 复用。片段时长 SHALL 遵循候选帧时长上限（MAX_SEC=90）。

#### Scenario: 视频片段与候选帧时间对齐

- **WHEN** 某段起止为 [12s, 34s)
- **THEN** 系统 SHALL 产出候选帧（c001 至 c022）及一个 22 秒的视频片段，两者覆盖相同的时间区间

#### Scenario: 已有片段时复用

- **WHEN** 重跑同一段，且 clip 文件已存在
- **THEN** 系统 SHALL 跳过 ffmpeg 裁剪，复用已有文件

### Requirement: 基于视频的帧预选

系统 SHALL 支持将视频片段输入多模态 VLM，由模型分析完整时序画面后返回各帧角色的时间戳。每秒级的视频内时间戳 SHALL 映射到对应候选帧路径（`atSec = startSec + timeSec`）。

#### Scenario: 视频分析产出帧预选

- **WHEN** VideoLlmExtractor 可用，且视频片段包含完整点位数流程
- **THEN** 系统 SHALL 返回 stand/aim 等帧角色的时间戳和描述，时间戳映射为候选帧路径，写入草稿 `frames`

#### Scenario: 时间戳精确映射到候选帧

- **WHEN** VLM 返回某帧在视频内 3s，段起点为 12s
- **THEN** 系统 SHALL 映射为候选帧 `c004`（候选帧从 c001 开始对应 startSec+0，c004 对应 startSec+3）

#### Scenario: 时间戳超出候选帧范围时丢弃

- **WHEN** VLM 返回的 timeSec 对应候选帧索引超出数组范围
- **THEN** 系统 SHALL 丢弃该帧指派，记 warning，不中断管线

### Requirement: 英雄专属 prompt 模板

系统 SHALL 按英雄 slug 选择帧预选的 prompt 模板，模板内容 SHALL 包含该英雄的技能列表、典型流程时序、以及 `review-config.ts` 中定义的 agentFrameRoles 各帧的画面特征描述。

#### Scenario: Jett 一突进点 prompt 含全部阶段

- **WHEN** 源英雄为 `jett`
- **THEN** prompt SHALL 包含 stand、aim、smoke_landing、trigger_timing、dash_landing、first_angle 六个阶段的画面特征与识别要点

#### Scenario: 未知英雄回退通用模板

- **WHEN** 源英雄无专属 prompt 模板
- **THEN** 系统 SHALL 使用默认通用模板（stand/aim/effect），不报错

### Requirement: 视频分析失败则回退图像采样

系统 SHALL 在视频分析不可用时（无 API key / 网络失败 / 模型返回无效结果）自动回退到现有 5 帧图像采样路径，不中断管线。

#### Scenario: 无 API key 时回退

- **WHEN** 未配置 GEMINI_API_KEY 且未配置 GEMINI_BASE_URL
- **THEN** 系统 SHALL 回退到现有 VlmExtractor 或 MockExtractor 的 selectFrames，草稿生成无阻断

#### Scenario: API 调用失败时回退

- **WHEN** VideoLlmExtractor 的 selectFrames 调用返回 HTTP 错误或 JSON 解析失败
- **THEN** 系统 SHALL 回退到图像采样路径，草稿 `frames` 使用 fallback 结果或留空

### Requirement: 视频分析结果可缓存

系统 SHALL 对视频分析请求做缓存，缓存键 SHALL 由模型 ID、prompt 文本和视频内容的 SHA256 哈希组成。缓存命中时 SHALL 复用结果，不重复调用 API。

#### Scenario: 重跑命中缓存

- **WHEN** 对同一段以相同模型和 prompt 再次做视频帧预选
- **THEN** 系统 SHALL 返回缓存结果，不产生 API 费用

#### Scenario: prompt 变更导致缓存 miss

- **WHEN** 同一段的 prompt 模板被修改（如优化了提示词）
- **THEN** 缓存 SHALL miss，重新调用 API

### Requirement: 油猴插件产出标准化时间轴输入

系统 SHALL 支持接收油猴插件生成的 `SourceVideo` 格式 JSON（含 `id`、`url`、`creator`、`hints.map`、`hints.agent`、`segments[]`），作为视频分段时间轴的输入源，跳过手写 `_timeline.txt` 步骤。

#### Scenario: 油猴 JSON 通过 SourceVideo 校验

- **WHEN** 油猴生成的 JSON 含合法 bvid、url、creator、hints.map、segments 数组且各 `startSec` 单调递增
- **THEN** 系统 SHALL 接受该输入并用于 fetch + capture + extract 流程

#### Scenario: 油猴 JSON 缺少必填字段时拒绝

- **WHEN** 油猴生成的 JSON 缺少 bvid 或 segments 为空
- **THEN** 系统 SHALL 提示校验失败，指明缺失字段

### Requirement: 编辑页面交互式触发视频分析

系统 SHALL 提供 Web 编辑页面（`/edit` 路由，复用 review server 端口 5180），允许用户：① 上传或粘贴油猴 SourceVideo JSON ② 系统自动触发视频下载与片段裁剪 ③ 在片段列表中勾选要处理的段 ④ 按段选择英雄 slug（下拉框，从 AGENTS 注册表读取）和 prompt 模板（自动匹配 agentFrameRoles）⑤ 编辑段标题 ⑥ 点击「生成」对选中段逐个调用 Gemini 视频分析 ⑦ 预览生成的帧预选结果 ⑧ 结果写入 `staging/<bvid>.json` 供 review UI 后续人审。

#### Scenario: 加载油猴 JSON 后自动 fetch + capture

- **WHEN** 用户在编辑页上传合法 SourceVideo JSON
- **THEN** 系统 SHALL 在后台下载视频、裁剪候选帧和视频片段，完成后渲染片段列表（含每段时长、候选帧数、缩略图）

#### Scenario: 勾选片段并选择 agent 后生成

- **WHEN** 用户勾选 segment-0 和 segment-2，为 segment-0 选择 `jett`，为 segment-2 选择 `sova`，点击「生成」
- **THEN** 系统 SHALL 对两段分别使用对应的 hero prompt 模板调用 Gemini，返回帧预选结果并预览

#### Scenario: 生成结果写入 staging

- **WHEN** 视频分析成功返回帧指派
- **THEN** 系统 SHALL 将帧映射写入 `staging/<bvid>.json`，草稿 `reviewStatus` 为 `pending`

#### Scenario: 某段生成失败不影响其他段

- **WHEN** segment-0 的视频分析成功但 segment-2 的 Gemini 调用超时
- **THEN** segment-0 SHALL 正常写入 staging，segment-2 SHALL 显示错误提示但页面不崩溃

### Requirement: 编辑页面与 review UI 通过 staging JSON 衔接

系统 SHALL 保证编辑页面产出的 staging JSON 与 review UI 读取的格式完全兼容。编辑页面 SHALL 在生成结果页提供跳转链接，点击后打开 review UI 并定位到对应 draft。

#### Scenario: 编辑页面产出可被 review UI 读取

- **WHEN** 编辑页面对某段成功生成帧预选并写入 staging
- **THEN** review UI SHALL 能加载该 bvid 的 staging 文件，该段显示 VLM 预选的帧为已选默认值

#### Scenario: 无 VLM 预选的段在 review UI 中帧为空

- **WHEN** 编辑页面中某段未勾选生成，或生成失败回退
- **THEN** review UI 中该段 `frames` SHALL 为空，`reviewStatus` 为 `pending`，审核员需手动指派
