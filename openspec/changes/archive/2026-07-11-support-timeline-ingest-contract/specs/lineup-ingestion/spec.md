## ADDED Requirements

### Requirement: 时间轴命令可生成可摄取的采集源清单

系统 SHALL 允许时间轴命令以显式的完整来源模式接收时间轴文本及 Bilibili 来源元数据，并输出符合 `SourceVideo[]` 契约的 JSON。完整模式 SHALL 要求合法 BVID、视频标题、创作者、地图 slug 和英雄 slug；输出 SHALL 包含解析出的 `segments`、对应 `hints`、平台 `bilibili`、由 BVID 派生的标准视频 URL，以及非空的来源致谢。

#### Scenario: 完整元数据生成可校验来源

- **WHEN** 录入者提供合法 BVID、标题、创作者、地图、英雄和含时间戳的时间轴文本
- **THEN** 命令 SHALL 输出单元素 `SourceVideo[]`，且该输出通过 `sourceFileSchema` 与 `check:sources` 校验并可作为 ingest 输入

#### Scenario: BVID 派生标准 URL

- **WHEN** 完整来源模式接收 BVID `BV1Tz4y1e7NK`
- **THEN** 输出的 `id` SHALL 为该 BVID，`url` SHALL 为 `https://www.bilibili.com/video/BV1Tz4y1e7NK`，且不含占位 URL

#### Scenario: 必填来源元数据缺失时失败

- **WHEN** 完整来源模式缺少 BVID、标题、创作者、地图或英雄中的任一字段，或 BVID 格式不合法
- **THEN** 命令 SHALL 以非零状态退出并指出缺失或无效字段，且不输出不完整的来源清单

### Requirement: 纯时间轴解析保持兼容

系统 SHALL 在未启用完整来源模式时继续把时间轴文本解析为 `ManualSegment[]` JSON，并保持现有的时间格式、跳过行和时间顺序诊断行为。

#### Scenario: 旧调用继续输出 segments

- **WHEN** 录入者在未提供完整来源模式选项的情况下运行时间轴命令
- **THEN** stdout SHALL 仅包含解析后的 `startSec` 与 `title` 段数组，不包含来源元数据包装
