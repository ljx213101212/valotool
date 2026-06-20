# lineup-ingestion Specification

## Purpose
TBD - created by archiving change add-lineup-ingest-pipeline. Update Purpose after archive.
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

系统 SHALL 在切片时优先使用源清单里的手抄时间轴，每段 `endSec` 由下一段 `startSec` 推得、末段取视频时长；无手抄时间轴时回退到章节或自动检测。

#### Scenario: 按手抄时间轴切片

- **WHEN** 源含 N 条 `segments`
- **THEN** 系统 SHALL 产出 N 个切片，第 i 段为 `[segments[i].startSec, segments[i+1].startSec)`，末段右界为视频时长

### Requirement: 取帧产出候选集与接触表，不预先指派角色

系统 SHALL 在 capture 阶段对每段按 1fps 抽候选帧，并用同批帧拼一张接触表；候选与接触表格子 1:1 对应（`atSec = startSec + i`）。系统 SHALL NOT 在此阶段自动指派 stand/aim/effect，该指派交人审。

#### Scenario: 候选数与段时长一致

- **WHEN** 某段时长为 D 秒（D ≤ 上限）
- **THEN** 系统 SHALL 产出约 D 张候选帧与 1 张接触表，且草稿的 `frames` 为空、`candidates` 非空

### Requirement: hybrid 结构化抽取，硬字段确定性来

系统 SHALL 复用现有 `parseQuery` 从段标题确定性抽取 `side`/`site`，软字段交可替换的 LLM extractor；无法从标题确定的字段 SHALL 记入 warning 而非编造。

#### Scenario: 标题确定性解析攻防与站点

- **WHEN** 段标题为「进攻a点内第一支」
- **THEN** 草稿 `fields.side` SHALL 为 `attack`、`fields.site` SHALL 为 `A`

#### Scenario: 无攻防字样时如实告警

- **WHEN** 段标题不含进攻/防守字样（如「a二楼上看二楼下」）
- **THEN** 系统 SHALL 在草稿 warning 标注「未能从标题确定 side」，不臆造 side

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

### Requirement: 人审从候选指派三帧并补全字段

系统 SHALL 提供本地人审工具，读取 staging 草稿及其候选帧/接触表，支持指派 stand/aim/effect、编辑软字段、approve/reject 写回。标记 approved 前 SHALL 用 `lineupSchema` 预校验整条，未通过不得置为 approved。

#### Scenario: 审核通过前校验

- **WHEN** 审核员把草稿标记 approved，但缺必填字段（如 `purpose` 为空、未指派三帧、`id` 非 kebab）
- **THEN** 系统 SHALL 拒绝该 approve、指出缺失字段，草稿保持 `pending`，但已编辑的字段/帧仍写回

#### Scenario: 指派三帧写回

- **WHEN** 审核员为草稿选定 stand/aim/effect 三张候选并保存
- **THEN** 草稿 `frames` SHALL 含三个 role→候选路径，并持久化到其 staging 文件

