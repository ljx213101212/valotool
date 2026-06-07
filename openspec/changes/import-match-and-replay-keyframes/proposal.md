## Why

产品初衷是「无畏契约战术复盘面板」，受众是想提升的玩家与职业俱乐部。此前演进偏向「实时互动沙盘」
（手动摆点、模拟技能连锁、血量/伤害结算），偏离了复盘初衷，且缺乏真实对局数据来源。

调研结论：Riot 官方/本地 `match-details` 接口可获取真实对局数据，无需视频上传与大额存储成本。
关键约束是 **API 不提供逐帧连续轨迹**，只在击杀/下包/拆包瞬间记录全员坐标快照。这恰好把产品形态
锚定为「关键决策节点复盘」，而非连续录像回放。本变更把这一方向正式纳入规格。

已完成的隔离 PoC（`src/features/match-replay/`，`?poc=replay`）用真实 Ascent 竞技样例验证了
数据→小地图渲染管线，坐标变换在真实数据上准确，地图朝向已对齐标准 VCT 方向（防守上、进攻下）。

## What Changes

- 新增 **对局数据导入**能力：把 Riot `match-details` 响应解析为类型化领域模型（玩家、回合、击杀、装置事件）。
- 新增 **关键帧复盘视图**能力：在官方小地图上按回合、按关键时刻还原全员位置快照、击杀连线、装置点。
- 新增 **地图坐标标定**：内置全 12 张图的 displayIcon 与坐标变换参数，并支持把各图朝向旋转到标准 VCT 方向。
- 沙盘模拟相关规格（`specs/ability`、`specs/damage`）降级封存至 `specs/_legacy/`，实现快照保留在 `legacy/sandbox-sim` 分支；本变更不删除沙盘代码。
- 暂不纳入范围（Non-goals）：逐帧连续走位回放、第一人称/准星、技能落点还原（API 无此数据）、真实账号认证接入（官方 Production Key 或本地 token 为后续独立变更）。

## Capabilities

### New Capabilities

- `match-data-import`：把 Riot `match-details` JSON 解析、校验为复盘所需的类型化领域模型，并提供地图坐标标定与变换。
- `keyframe-replay-view`：按回合与关键时刻在小地图上渲染真实对局的全员位置快照、击杀连线与装置事件。

### Modified Capabilities

- None。`specs/map/spec.md` 描述的地图渲染架构继续复用；如复盘视图引入新的渲染层，实现时同步更新该文档。

## Impact

- 新增特性目录：`src/features/match-replay/`（types、mapCalibration、agentUuidMap、deriveMoments、视图组件）。
- 数据样例：`public/sample/competitive-ascent.json`（脱敏真实对局，用于离线开发与演示）。
- 入口开关：`src/main.tsx` 经 `?poc=replay` 挂载复盘视图，不影响主 App。
- 规格结构：新增 `specs/_legacy/`，迁入 `ability/`、`damage/`。
- 后续（非本变更）：真实数据接入路线、token 换英雄头像、击杀热力图、回合经济条、A/B 进攻方向统计。
