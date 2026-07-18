## MODIFIED Requirements

### Requirement: 切片优先采用手抄时间轴

系统 SHALL 在切片时优先使用源清单里的手抄时间轴，每段 `endSec` 由下一段 `startSec` 推得、末段取视频时长；无手抄时间轴时，SHALL 回退到视频章节信息；无章节时，SHALL 尝试从字幕自动分段；无任何分段信息时 SHALL 报错。

#### Scenario: 按手抄时间轴切片（不变）

- **WHEN** 源含 N 条 `segments`
- **THEN** 系统 SHALL 产出 N 个切片，第 i 段为 `[segments[i].startSec, segments[i+1].startSec)`，末段右界为视频时长

#### Scenario: 章节信息回退分段

- **WHEN** 源无手抄时间轴，但 `fetch` 阶段提取到 N 个章节
- **THEN** 系统 SHALL 以章节起止时间为边界产出 N 个切片，标题取章节标题

#### Scenario: 字幕自动分段回退

- **WHEN** 源无手抄时间轴、无章节，但有字幕文件
- **THEN** 系统 SHALL 解析字幕按关键词/停顿切分，产出切片（每段 ≥ 5 秒、≤ 90 秒）

### Requirement: 取帧产出候选集与接触表，VLM 可预选帧

系统 SHALL 在 capture 阶段对每段按 1fps 抽候选帧，并用同批帧拼一张接触表。extract 阶段 SHALL 调用 extractor 的 `selectFrames` 方法尝试自动指派 stand/aim/effect 帧；自动指派失败（无 VLM / 低置信）时帧留空交人审。VLM 预选帧为默认值，人审可覆盖。

#### Scenario: VLM 预选帧为默认值

- **WHEN** VLM extractor 可用，且 `selectFrames` 返回帧指派
- **THEN** 草稿 `frames` SHALL 含 VLM 选定的角色→路径，人审时显示为已选默认值

#### Scenario: 无 VLM 时帧留空

- **WHEN** 使用 MockExtractor 或 VLM 不可用
- **THEN** 草稿 `frames` SHALL 为空，人审从接触表手动指派

### Requirement: 人审帧角色区分必填与选填

系统 SHALL 按 agent 配置帧角色，其中 `required: true` 的角色（默认为 stand/aim/effect）SHALL 在 approve 前被校验为已指派；`required: false` 的角色（agent-specific 如 Jett 的 dash_direction）SHALL 为可选审核辅助，不阻塞 approve。

#### Scenario: 必填帧缺失时拒绝 approve

- **WHEN** 审核员标记 approved，但 stand/aim/effect 中任一未指派
- **THEN** 系统 SHALL 拒绝 approve，指出缺失帧角色，草稿保持 pending

#### Scenario: 选填帧缺失不阻塞 approve

- **WHEN** 审核员标记 approved，stand/aim/effect 已指派但 agent-specific 帧（如 smoke_request）未指派
- **THEN** 系统 SHALL 通过校验，允许 approve
