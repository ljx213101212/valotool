# specs/_legacy —— 沙盘模拟时期的封存规格

本目录封存「实时互动沙盘」阶段的规格：技能效果模拟（烟雾/闪光/位移）、伤害结算、血量系统等。
2026-06-07 产品方向调整后，主线转向 **基于真实对局数据的关键帧战术复盘**
（见 `openspec/changes/import-match-and-replay-keyframes/`），这些模拟玩法不再是主线投入方向。

## 为什么保留而非删除

- 规格记录了已实现的能力语义，未来若做「教学沙盘」可复活。
- 对应的完整实现代码快照保存在分支 **`legacy/sandbox-sim`**（远程已推送）。
- 当前 `src/features/abilities`、`src/features/map` 等沙盘代码仍在仓库中，本次仅降级规格优先级，未删代码。

## 封存内容

- `ability/`：技能基础语义 + flash/smoke/dash/damage 子规格。
- `damage/`：伤害结算规格。

## 未封存（仍在主线复用）

- `specs/map/spec.md`：地图渲染架构（Konva 图层、坐标系），复盘视图继续复用。
- 墙体几何/视线遮挡：实现仍在 `src/shared/utils/mapGeometry.ts`，复盘暂不依赖，未来可选。
