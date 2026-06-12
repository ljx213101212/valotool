# lineup-content-model Specification

## Purpose
TBD - created by archiving change add-lineup-quick-lookup. Update Purpose after archive.
## Requirements
### Requirement: 点位内容的结构化 schema
系统 SHALL 以结构化 schema 定义点位内容，每条点位至少包含：地图、英雄、技能槽位、阵营
（攻/防）、站点（A/B/C/中路）、难度档（必学/进阶/花活）、手法枚举、1–3 张带角色语义的图片、
版本有效性字段与检索关键词。

#### Scenario: 合法点位通过校验
- **WHEN** 一条点位包含全部必填字段，且图片 role 取值于 `stand | aim | effect` 且互不重复
- **THEN** 校验脚本 SHALL 通过该条目

#### Scenario: 非法点位被拒绝
- **WHEN** 点位缺少 `verifiedPatch`、引用了注册表中不存在的地图/英雄、或图片超过 3 张
- **THEN** 校验脚本 SHALL 报错并指明字段，退出码非 0

### Requirement: 版本有效性为一等公民
系统 SHALL 在每条点位上维护 `verifiedPatch` 与 `status`（`verified | stale | draft`），
供前端区分展示，不得静默隐藏过期内容。

#### Scenario: 地图改版后的批量标记
- **WHEN** 某张地图在新版本被改动，运营把该图点位批量置为 `stale`
- **THEN** 这些点位 SHALL 保留在数据中且 status 为 `stale`，校验脚本不视为错误

### Requirement: 地图与英雄注册表内置中文检索元数据
系统 SHALL 维护地图与英雄注册表，每条含官方中文名、英文名、拼音全拼、拼音首字母与社区
别名数组，并标记地图是否在当前排位图池。

#### Scenario: 别名命中
- **WHEN** 以「火男」或「yhxc」查询注册表
- **THEN** 系统 SHALL 分别解析到英雄「不死鸟」与地图「亚海悬城」

#### Scenario: 图池标记
- **WHEN** 读取地图注册表
- **THEN** 每张地图 SHALL 含布尔字段标识其是否在当前排位图池，供前端排序置顶

### Requirement: 必学档的策展约束
系统 SHALL 把「必学」档作为策展单元约束：同一「地图 × 英雄 × 阵营」组合内必学点位
目标不超过 5 条。

#### Scenario: 超出策展上限的告警
- **WHEN** 某组合内必学点位超过 5 条
- **THEN** 校验脚本 SHALL 输出告警（不阻断），提示运营降档处理

