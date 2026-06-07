## ADDED Requirements

### Requirement: 解析 match-details 为类型化领域模型
系统 SHALL 把 Riot `match-details` 响应解析为复盘所需的类型化领域模型，至少包含玩家、回合、击杀与装置事件及其坐标。

#### Scenario: 解析有效竞技对局
- **WHEN** 输入为一份完整的 Bomb 模式 `match-details` 响应
- **THEN** 系统 SHALL 产出玩家列表（含 teamId、characterId）、回合结果列表、击杀列表，且每个击杀含击杀者、死者、`victimLocation` 与 `playerLocations` 快照

#### Scenario: 缺失或空字段降级
- **WHEN** 响应中 `kills` 为 null、或某回合无装置事件
- **THEN** 系统 SHALL 不抛出异常，并把对应数据视为「无该事件」处理

### Requirement: 游戏世界坐标到小地图的标定变换
系统 SHALL 依据每张地图的标定参数，把游戏世界坐标变换为小地图归一化坐标，并支持把朝向旋转到标准 VCT 方向。

#### Scenario: 坐标变换遵循 x/y 互换公式
- **WHEN** 给定某图标定与一个游戏坐标 `location`
- **THEN** 归一化结果 SHALL 为 `normX = location.y*xMultiplier + xScalarToAdd`、`normY = location.x*yMultiplier + yScalarToAdd` 再施加该图的朝向旋转

#### Scenario: 标准 VCT 朝向
- **WHEN** 某图配置了顺时针 90°×N 的 `rotationSteps`
- **THEN** 变换后的坐标与背景底图 SHALL 一致地旋转，使防守方在上、进攻方在下

#### Scenario: 缺少标定的地图
- **WHEN** 对局的 mapId 不在内置标定表中
- **THEN** 系统 SHALL 报告缺少标定，而非渲染错位坐标

### Requirement: Agent UUID 到项目 slug 的映射
系统 SHALL 把 Riot `characterId`（agent UUID）映射到项目内 agent slug，并在无法映射时优雅降级。

#### Scenario: 已知 agent 命中头像
- **WHEN** `characterId` 命中内置 UUID→slug 映射
- **THEN** 系统 SHALL 提供对应 slug 以复用英雄头像

#### Scenario: 脱敏或未知 characterId 降级
- **WHEN** `characterId` 不在映射表中（如脱敏样例）
- **THEN** 系统 SHALL 降级为队伍色标识，不阻断渲染
