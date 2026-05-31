# Refactor #2: Map.tsx 模块化拆分

> 日期：2026-05-31
> 目标：将 1294 行的 `Map.tsx` 按职责拆分为多个文件，提升可读性和可维护性

## 动机

`Map.tsx` 是地图模块的枢纽组件，承担了过多职责：

- 120 行 zustand store 选择器
- 350 行重复的技能放置交互 effect（7 种几乎相同的 mousemove+click 监听模式）
- 200 行预览坐标同步回调
- 400 行 JSX 渲染（地图背景、技能效果、预览、token 图层）
- 60 行调试工具栏逻辑
- 各种 popover 关闭 / Escape 取消 / ability 删除后的清理 effect

单个文件 1294 行，任何修改都需要在大量代码中定位，且 7 个放置 effect 之间存在大量重复。

## 方案

按职责拆分为以下文件结构：

```
src/features/map/
  components/
    Map.tsx                    # 协调层（~400 行）
    MapBackgroundLayers.tsx    # 地形/区域/墙壁渲染 (new)
    MapAbilityRenderLayer.tsx  # 技能效果 + 预览渲染 (new)
    MapAbilityToken.tsx        # (unchanged)
    MapHeroToken.tsx           # (unchanged)
    MapSphericalSmoke.tsx      # (unchanged)
    MapFixedDualLineSmoke.tsx  # (unchanged)
    MapFixedSingleLineSmoke.tsx # (unchanged)
    MapCurveSmoke.tsx          # (unchanged)
    MapDirectMovement.tsx      # (unchanged)
    ...
  hooks/                       # (new directory)
    useMapPlacementPreviews.ts # 预览坐标同步回调 (new)
    useMapPlacementEffects.ts   # 7 种放置交互 effect (new)
specs/
  map/
    spec.md                    # 地图模块架构规格 (new)
  refactor/
    refactor_2.md              # 本次重构记录 (this file)
```

### 职责划分

| 文件 | 职责 | 行数 |
|------|------|------|
| `Map.tsx` | store 选择器、派生布尔值、popover/清理 effect、JSX 编排 | ~400 |
| `MapBackgroundLayers.tsx` | 4 个 Konva Layer：walkableFloor、boxWalkable、areas、walls | ~80 |
| `MapAbilityRenderLayer.tsx` | 技能效果渲染（球烟/双线烟/单线烟/曲线烟/位移）+ 预览渲染 + smoke meta memo | ~310 |
| `useMapPlacementPreviews.ts` | 6 个 sync*FromClient 回调，将鼠标屏幕坐标转换为地图坐标 | ~110 |
| `useMapPlacementEffects.ts` | 7 个 use*PlacementEffect hooks + `useSimplePlacementEffect` 共享实现 | ~260 |

### 关键设计决策

1. **hooks/ 目录**：新增 `src/features/map/hooks/` 存放交互逻辑 hooks，与纯渲染组件分离。这是项目首次引入 feature-level hooks 目录。

2. **useSimplePlacementEffect 共享实现**：球烟、直接位移、锚点位移、炸弹跳 4 种放置模式有完全相同的 mousemove+click 交互模式，抽取为内部函数 `useSimplePlacementEffect`，每个公开 hook 通过参数化调用。

3. **曲线烟独立处理**：曲线烟交互模式不同（mousedown 开始绘制 → mousemove 追加点 → mouseup 确认），保持独立实现。

4. **双线/单线烟**：它们有相同的交互模式但需要额外计算朝向（facing），保留独立实现以避免过度抽象。

5. **MapAbilityRenderLayer 自包含**：该组件自我管理所有预览状态的 store selectors 和 memo 计算，Map.tsx 只需传递一个 `onCmdClick` 回调。

6. **tsconfig.app.json 修复**：添加 `"ignoreDeprecations": "6.0"` 以消除 TypeScript 7.0 的 `baseUrl` 弃用警告。

7. **weapons/localization 类型修复**：修复 `getWeaponLabel` 和 `getArmorLabel` 中的隐式 any 索引类型错误。

## 变更清单

### 新建文件
- `specs/map/spec.md`
- `specs/refactor/refactor_2.md`
- `src/features/map/hooks/useMapPlacementPreviews.ts`
- `src/features/map/hooks/useMapPlacementEffects.ts`
- `src/features/map/components/MapBackgroundLayers.tsx`
- `src/features/map/components/MapAbilityRenderLayer.tsx`

### 修改文件
- `src/features/map/components/Map.tsx` — 从 1294 行精简为 ~400 行协调层
- `tsconfig.app.json` — 添加 `ignoreDeprecations: "6.0"`
- `src/features/weapons/localization/index.ts` — 修复类型错误

### 未修改的现有组件（行为不变）
- `MapAbilityToken.tsx`
- `MapHeroToken.tsx`
- `MapSphericalSmoke.tsx`
- `MapFixedDualLineSmoke.tsx`
- `MapFixedSingleLineSmoke.tsx`
- `MapCurveSmoke.tsx`
- `MapDirectMovement.tsx`
- `AbilityInstanceActionPopover.tsx`
- `Map.less`

## 验证

- `pnpm run build` 通过，无类型错误
- 所有 existing component 的行为保持不变（纯提取，无逻辑修改）
- `shared` 目录无对 `features/...` 的 import，边界约定保持

## 后续建议

1. 7 个清理 effect（ability 删除后 cancel placement）在 Map.tsx 中仍有重复，可进一步抽到 hooks
2. `MapAbilityRenderLayer` 仍有 ~310 行，大量 memo 计算可考虑抽取自定义 hook
3. 调试工具栏逻辑（`spawnSmokeCatalogOnMap` 等）可移至独立的 debug hook