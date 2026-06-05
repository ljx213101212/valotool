# 地图模块 (Map Feature) 规格

> 本文档描述 `src/features/map/` 的架构、组件树、交互流程与数据流，供 AI 辅助重构时参考。

## 目录结构

```
src/features/map/
  components/             # 纯渲染组件（组件与 .less 共置）
    Map.tsx               # 协调层：store选择、状态派生、编排子组件
    MapBackgroundLayers.tsx  # 地形层（walkableFloor/boxWalkable）+ 区域层 + 墙壁层
    MapAbilityRenderLayer.tsx # 技能效果 + 预览渲染
    MapAbilityToken.tsx   # 地图上的技能token（可拖拽）
    MapHeroToken.tsx       # 地图上的特工token（可拖拽）
    MapSphericalSmoke.tsx  # 球型烟雾可视化
    MapFixedDualLineSmoke.tsx  # 固定双线烟雾可视化
    MapFixedSingleLineSmoke.tsx # 固定单线烟雾可视化
    MapCurveSmoke.tsx      # 曲线烟雾可视化
    MapDirectMovement.tsx  # 直线位移可视化
    MapProjectilePath.tsx  # 投射物墙体命中/反弹路径可视化
    MapLineOfSightDebugOverlay.tsx # DEV/调试用视线遮挡验算线
    MapPicker.tsx          # 选图组件
    AbilityInstanceActionPopover.tsx  # 技能实例操作弹窗
    AbilityInstancePreparationPopover.tsx # 技能准备弹窗
    AbilityInstanceTimelinePopover.tsx   # 技能时间轴弹窗
  hooks/                  # 交互逻辑 hooks
    useMapPlacementPreviews.ts  # 鼠标坐标 → 地图坐标的同步回调
    useMapPlacementEffects.ts   # 7 种技能放置的交互 effect
```

## 组件职责

### Map.tsx（协调层）
- 通过 zustand selector 从 `useMatchupStore` 读取所有地图相关状态
- 派生放置状态布尔值（`placingSphericalSmoke` 等）
- 注册全局事件清理 effect（Escape键、外部点击关闭popover、ability删除后清理）
- 编排 Konva Stage + Layer 层级结构
- 挂载调试工具栏（DEV only）

### MapBackgroundLayers.tsx
- Layer 1: 可通行地板（`valorantMap.walkableFloor`）— 半透明填充
- Layer 2: 箱体可通行区域（`valorantMap.boxWalkable`）— 填充 + 描边
- Layer 3: 命名区域（`valorantMap.areas`）— 填充 + 青色描边
- Layer 4: 墙壁（`valorantMap.walls`）— 白色线段

### MapAbilityRenderLayer.tsx
- Layer 5: 已部署技能效果渲染
  - 直线位移 → `MapDirectMovement`
  - 球烟 → `MapSphericalSmoke`
  - 双线烟 → `MapFixedDualLineSmoke`
  - 单线烟 → `MapFixedSingleLineSmoke`
  - 曲线烟 → `MapCurveSmoke`
  - 投射物路径 → `MapProjectilePath`
  - DEV/调试视线遮挡验算 → `MapLineOfSightDebugOverlay`
- Layer 5 附加: 放置预览渲染（`preview` prop）

### MapAbilityToken Layer / MapHeroToken Layer
- 独立的 `Layer`，互不干扰的渲染层级

## 交互流程

### 球烟放置流程 (Spherical Smoke)
```
cmd+click Skill Token → openAbilityPopover → click "放置"
  → sphericalSmokePlacementId 设置 → 光标变 crosshair
  → mousemove: syncSphericalSmokePreviewFromClient → 更新 sphericalSmokePreview
  → click: confirmSphericalSmokePlacement(x,y) → 完成
  → Esc: cancelSphericalSmokePlacement → 取消
```

### 曲线烟放置流程 (Curve Smoke)
```
cmd+click Skill Token → openAbilityPopover → click "放置"
  → curveSmokePlacementId 设置 → 光标变 crosshair
  → mousedown: 开始绘制 (curveDrawingRef=true, setCurveSmokePreviewPoints)
  → mousemove: appendCurvePoint → 沿鼠标轨迹追加点
  → mouseup: isValidCurveSmokePoints → confirmCurveSmokePlacement 或清空
  → Esc: cancelCurveSmokePlacement
```

### 位移放置流程 (Direct / Anchor / BlastPack)
与球烟类似，mousemove 跟随 + click 确认 + Esc 取消。

## 数据流

```
useMatchupStore (Zustand)
  ├── mapPlacements[]           → MapHeroToken 列表
  ├── abilityPlacements[]       → MapAbilityToken 列表 + 技能效果渲染
  ├── sphericalSmokePlacementId → 放置模式判断
  ├── sphericalSmokePreview     → 预览渲染坐标
  ├── ... (其他放置状态)
  │
  └── Map.tsx selector → 分发到子组件/hooks
```

## 与 shared 的边界
- 地图数据源: `shared/data/valorantMap.ts`
- 墙体几何工具: `shared/utils/mapGeometry.ts`，负责 2D LOS 遮挡、射线最近墙命中、有限次数反弹路径。它使用 `valorantMap.walls` 的 opaque 线段作为战术板近似，不表示完整 3D 视野系统。
- 放置状态 store: `shared/store/useMatchupStore.ts`
- 技能配置: `features/abilities/config.ts`
- features/map 只依赖 shared 和 features/abilities，不反向

## 约束
- `Map.tsx` 不直接实现放置交互细节，委托给 `hooks/` 中的 hook
- 组件不直接调用 `useMatchupStore.getState()`，保持纯渲染
- 所有新建文件需在本次 spec 中记录
