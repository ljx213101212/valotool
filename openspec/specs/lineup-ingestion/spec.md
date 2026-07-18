# lineup-ingestion Specification

## Purpose

定义从 B 站攻略视频半自动录入结构化点位的管线：fetch → segment → capture → extract → stage → 人审 → promote。核心目标是降低数据准备的人工成本，把人的角色从创作者降为审核员。
## Requirements
### Requirement: 采集源以结构化清单声明

系统 SHALL 以结构化清单（`sources/*.json`）声明采集源，每个源至少含 B 站 bvid、平台、url、创作者、致谢串，可选地图/英雄提示、视频版本与手抄时间轴；并提供校验脚本对清单做 schema 校验。

#### Scenario: 合法采集源通过校验

- **WHEN** 一个源含合法格式 bvid（`^BV[0-9A-Za-z]{10}$`）、平台为 `bilibili`、url/creator/credit 齐全，且各 `segments[].startSec` 单调递增
- **THEN** `check:sources` SHALL 通过并报告视频数与段数

#### Scenario: 非法采集源被拒绝

- **WHEN** 源的 bvid 格式非法、缺必填字段、或 `hints.map` 不在地图注册表
- **THEN** `check:sources` SHALL 报错并指明字段，退出码非 0

### Requirement: 管线分阶段、工件落盘、幂等可恢复

系统 SHALL 把录入拆为 `fetch → segment → capture → extract → stage` 五阶段，各阶段工件落盘；已存在的工件 SHALL 被复用而非重算。

#### Scenario: 重跑复用已下载视频与已抽帧

- **WHEN** 对同一 bvid 再次运行管线，且 `.work/<bvid>` 已有视频与候选帧
- **THEN** 系统 SHALL 跳过下载与抽帧，直接复用磁盘工件

### Requirement: 切片优先采用手抄时间轴

系统 SHALL 在切片时优先使用源清单里的手抄时间轴，每段 `endSec` 由下一段 `startSec` 推得、末段取视频时长；无手抄时间轴时，SHALL 回退到视频章节信息；无章节时，SHALL 尝试从字幕自动分段；无任何分段信息时 SHALL 报错。

#### Scenario: 按手抄时间轴切片

- **WHEN** 源含 N 条 `segments`
- **THEN** 系统 SHALL 产出 N 个切片，第 i 段为 `[segments[i].startSec, segments[i+1].startSec)`，末段右界为视频时长

#### Scenario: 章节信息回退分段

- **WHEN** 源无手抄时间轴，但 `fetch` 阶段从 yt-dlp 提取到 N 个章节
- **THEN** 系统 SHALL 以章节起止时间为边界产出 N 个切片，标题取章节标题

#### Scenario: 字幕自动分段回退

- **WHEN** 源无手抄时间轴、无章节，但下载到字幕文件
- **THEN** 系统 SHALL 解析字幕按停顿/关键词切分，产出切片（每段 ≥ 5 秒、≤ 90 秒）

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

### Requirement: 取帧产出候选集与接触表，VLM 可预选帧

系统 SHALL 在 capture 阶段对每段按 1fps 抽候选帧，并用同批帧拼一张接触表；候选与接触表格子 1:1 对应（`atSec = startSec + i`）。extract 阶段 SHALL 调用 extractor 的 `selectFrames` 方法尝试自动指派 stand/aim/effect 帧；自动指派失败（无 VLM / 低置信）时帧留空交人审。VLM 预选帧为默认值，人审可覆盖。

#### Scenario: 候选数与段时长一致

- **WHEN** 某段时长为 D 秒（D ≤ 上限）
- **THEN** 系统 SHALL 产出约 D 张候选帧与 1 张接触表

#### Scenario: VLM 预选帧为默认值

- **WHEN** VLM extractor 可用，且 `selectFrames` 返回帧指派
- **THEN** 草稿 `frames` SHALL 含 VLM 选定的角色→路径，人审时显示为已选默认值

#### Scenario: 无 VLM 时帧留空

- **WHEN** 使用 MockExtractor 或 VLM 不可用
- **THEN** 草稿 `frames` SHALL 为空，人审从接触表手动指派

### Requirement: hybrid 结构化抽取，硬字段确定性来

系统 SHALL 复用现有 `parseQuery` 从段标题确定性抽取 `side`/`site`；软字段（`abilitySlot`/`technique`/`origin`/`target`/`purpose`/`timing`）SHALL 由可替换的 extractor 抽取，其默认实现为读取该段画面的**多模态 VLM**。无法确定的字段 SHALL 记入 warning 而非编造；VLM 输出 SHALL 经 schema 校验，非法字段丢弃并告警，不使整段失败。

#### Scenario: 标题确定性解析攻防与站点

- **WHEN** 段标题为「进攻a点内第一支」
- **THEN** 草稿 `fields.side` SHALL 为 `attack`、`fields.site` SHALL 为 `A`

#### Scenario: 无攻防字样时如实告警

- **WHEN** 段标题不含进攻/防守字样（如「a二楼上看二楼下」）
- **THEN** 系统 SHALL 在草稿 warning 标注「未能从标题确定 side」，不臆造 side

#### Scenario: VLM 输出经 schema 校验

- **WHEN** VLM 返回的 `abilitySlot`/`technique` 不在枚举内，或 JSON 解析失败
- **THEN** 系统 SHALL 丢弃非法字段（坏 JSON 则整体降级为空软字段）、记 warning，并保留已确定的硬字段，不中断该段

### Requirement: 草稿隔离于 staging，人审通过才入正式数据

系统 SHALL 把抽取结果以 `DraftLineup`（`Lineup` 超集，含 provenance/confidence/warnings/reviewStatus）写入 `staging/`；只有经人审 `promote` 并通过 `lineupSchema` 校验的草稿，才 SHALL 落入 `data/lineups` 与 `raw-images`。

#### Scenario: 未审草稿不进正式数据

- **WHEN** 管线产出草稿但尚未人审
- **THEN** 草稿 SHALL 仅存在于 `staging/`，`reviewStatus` 为 `pending`，且 `data/lineups` 不被写入

### Requirement: 全程保留溯源，禁止抓取竞品数据

系统 SHALL 在每条草稿上保留 provenance（视频 id、url、创作者、时间区间）以供致谢与回查；内容来源 SHALL 限于公开创作者视频，SHALL NOT 抓取竞品小程序数据。

#### Scenario: 草稿携带溯源

- **WHEN** 任意草稿生成
- **THEN** 其 `provenance` SHALL 含 `videoId`、`url`、`creator` 及该段 `startSec`/`endSec`

### Requirement: 人审从候选指派帧并补全字段，区分必填与选填

系统 SHALL 提供本地人审工具，读取 staging 草稿及其候选帧/接触表，支持指派帧角色、编辑软字段、approve/reject 写回。标记 approved 前 SHALL 用 `lineupSchema` 预校验整条，并校验必填帧角色（stand/aim/effect）均已指派；agent-specific 选填帧未指派不阻塞 approve。

#### Scenario: 审核通过前校验

- **WHEN** 审核员把草稿标记 approved，但缺必填字段（如 `purpose` 为空、必填帧未指派、`id` 非 kebab）
- **THEN** 系统 SHALL 拒绝该 approve、指出缺失字段/帧，草稿保持 `pending`，但已编辑的字段/帧仍写回

#### Scenario: 指派帧写回

- **WHEN** 审核员为草稿选定帧并保存
- **THEN** 草稿 `frames` SHALL 含角色→候选路径，并持久化到其 staging 文件

#### Scenario: 必填帧缺失时拒绝 approve

- **WHEN** 审核员标记 approved，但 stand/aim/effect 中任一未指派
- **THEN** 系统 SHALL 拒绝 approve，指出缺失帧角色，草稿保持 pending

#### Scenario: 选填帧缺失不阻塞 approve

- **WHEN** 审核员标记 approved，stand/aim/effect 已指派但 agent-specific 帧（如 Jett 的 smoke_request）未指派
- **THEN** 系统 SHALL 通过校验，允许 approve

### Requirement: 软字段由多模态 VLM 读帧抽取

系统 SHALL 支持把段的画面（默认该段接触表图）输入多模态 VLM 抽取软字段；模型经 env 配置（base url / key / model）、provider 无关；调用结果 SHALL 可缓存以便幂等重跑不重复付费；无配置时 SHALL 回退到占位 extractor，不阻断管线。

#### Scenario: 缺模型配置时降级

- **WHEN** 未配置 VLM（无 key）
- **THEN** 管线 SHALL 用占位 extractor 继续产出草稿（软字段留空交人审），不报错

#### Scenario: 重跑命中缓存

- **WHEN** 对同一段以相同画面再次抽取且缓存已存在
- **THEN** 系统 SHALL 复用缓存结果，不重复调用 VLM

### Requirement: 抽取质量有 eval 量化

系统 SHALL 提供 eval：以人审 `approved` 草稿的软字段为 ground truth，对类别字段（`abilitySlot`/`technique`）计算精确命中率，对自由文本字段并排导出供人工判定，并输出报告。

#### Scenario: 类别字段命中率

- **WHEN** 存在 N 条人审 ground truth
- **THEN** eval SHALL 对每条跑 extractor，按 `abilitySlot`/`technique` 是否等于 ground truth 统计命中率并报告

#### Scenario: ground truth 为空

- **WHEN** 尚无人审 approved 草稿
- **THEN** eval SHALL 提示无 ground truth 并退出，不报错
