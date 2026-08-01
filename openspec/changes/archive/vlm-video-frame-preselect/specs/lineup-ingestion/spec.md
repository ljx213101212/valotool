## MODIFIED Requirements

### Requirement: 取帧产出候选集、视频片段与接触表，VLM 可预选帧

系统 SHALL 在 capture 阶段对每段按 1fps 抽候选帧，并用同批帧拼一张接触表；候选与接触表格子 1:1 对应（`atSec = startSec + i`）；此外 SHALL 为每段额外裁剪视频片段工件（`<workDir>/<bvid>/clips/<segmentId>.mp4`）。extract 阶段 SHALL 优先调用视频分析提取器（若可用）从视频片段中识别各帧角色的时间戳并映射到候选帧；视频分析不可用时 SHALL 回退到现有图像采样路径。自动指派失败（无 extractor / 低置信）时帧留空交人审。VLM 预选帧为默认值，人审可覆盖。

#### Scenario: 候选数与段时长一致

- **WHEN** 某段时长为 D 秒（D ≤ 上限）
- **THEN** 系统 SHALL 产出约 D 张候选帧、1 张接触表、及 1 个视频片段

#### Scenario: 视频分析预选帧为默认值

- **WHEN** VideoLlmExtractor 可用，且 `selectFrames` 从视频片段返回帧指派
- **THEN** 草稿 `frames` SHALL 含 VLM 选定的角色→路径，人审时显示为已选默认值

#### Scenario: 视频不可用时回退图像预选

- **WHEN** 视频分析 extractor 不可用或调用失败
- **THEN** 系统 SHALL 回退到现有 5 帧图像采样路径做预选

#### Scenario: 无任何 extractor 时帧留空

- **WHEN** 使用 MockExtractor 或 VLM 均不可用
- **THEN** 草稿 `frames` SHALL 为空，人审从接触表手动指派
