# 设计说明：导入对局 + 关键帧复盘

## 数据来源与关键约束

Riot `match-details`（官方 VAL-MATCH 或本地 PVP 端点）返回结构化对局数据。坐标为**游戏世界坐标**。
**关键现实：无逐帧轨迹。** 仅以下事件点记录全员存活位置快照：

- `kills[]`：每次击杀的 `playerLocations`（存活玩家 + `viewRadians`）、`victimLocation`、`finishingDamage`、`round`、`roundTime`。
- `roundResults[].plantPlayerLocations` + `plantLocation`、`defusePlayerLocations` + `defuseLocation`。

因此复盘单位是「关键时刻（moment）」：一回合 = 有序的击杀帧 + 下包/拆包帧。

## 坐标变换

来自 valorant-api.com `/v1/maps` 的每图 4 参数（注意游戏 x/y 与图片互换）：

```
normX = location.y * xMultiplier + xScalarToAdd
normY = location.x * yMultiplier + yScalarToAdd
```

标准 VCT 朝向（防守 CT 上、进攻 T 下）需对各图施加顺时针 90°×N 旋转（`rotationSteps`，逐图标定）。
归一化点旋转 `(x,y)→(1-y,x)`，方向向量旋转 `(dx,dy)→(-dy,dx)`，背景图同步旋转，文字标签保持正立。
Ascent 已标定 `rotationSteps=1`，A 点下包坐标经变换落在右上（与官方小地图一致），验证通过。

## 模块划分（已落地 PoC 结构）

- `types.ts`：`match-details` 忠实子集 + `ReplayMoment` 派生模型。
- `mapCalibration.ts`：全 12 图标定 + `gameToNormalized/gameToPixel/viewDirToPixel/rotationDegrees`。
- `agentUuidMap.ts`：Riot characterId UUID → 项目 agent slug（复用头像；脱敏样例查不到时降级）。
- `deriveMoments.ts`：`deriveRoundMoments(match, roundNum)` → 有序 moment 列表。
- `MatchReplayPoc.tsx`：react-konva 渲染（官方小地图底图 + token/朝向/击杀连线/装置标记 + 回合与帧选择）。

## 取舍

- **官方小地图底图 vs 自绘 SVG 小地图**：PoC 用官方 displayIcon + 官方标定，零手动校准、自洽。
  项目原有 vtracer 自绘小地图是另一套像素坐标系，若要复用需逐图拟合仿射变换 —— 列为后续可选项，不阻塞主线。
- **脱敏样例**：玩家名/英雄被打码但坐标真实自洽，足以验证定位/击杀/装置管线；接真实数据后头像映射自然生效。
- **朝向箭头**：viewRadians 经同一线性变换近似可视化，非精确。
