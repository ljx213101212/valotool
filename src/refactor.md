## 简介

功能增多后，`components/` 与 `modules/` 混放、根目录 `store/` / `utils/` 堆叠，导航与职责边界变模糊。本文约定按业务域整理 `src/` 的形态与规则。

**当前状态（已落地）**：`src/shared/` 存放跨域 store、utils、types、constants、`data`；`src/features/<域>/` 存放各业务 UI 与局部资源；`App.tsx` 通过 `@/features/...` 组装入口。

## 目标域（业务模块）

| 域 | 说明 |
|----|------|
| **agents**（特工） | 特工列表、详情抽屉、地图 token、买枪弹窗等与「人」强相关的 UI |
| **weapons**（武器） | 武器展示/选择 UI；静态资源仍在 `src/assets/weapons` |
| **abilities**（技能） | 尚未实现；`features/abilities/index.ts` 占位 |
| **map**（地图） | 战术地图画布、选图、`MapHeroToken` |
| **timeline**（时间线） | 轨道、标尺、游标、播放控制 |
| **keyframes**（关键帧） | `KeyframeDetailDrawer` 等关键帧编辑 UI |
| **shell**（应用壳） | `AppLayout`、`DndAppProvider`、应用级槽位 |
| **tactical-panels**（战术面板） | 左战术栏、右 Inspector、对位模块等 |

## 当前目录树（摘要）

```
src/
  App.tsx
  main.tsx
  features/
    agents/components/
    weapons/components/          # index.ts 占位
    abilities/index.ts          # 占位
    map/components/
    timeline/components/
    keyframes/components/
    shell/layout/               # AppLayout
    shell/components/           # DndAppProvider
    tactical-panels/components/
  shared/
    store/
    utils/
    types/
    constants/                  # 含 tacticalSideColors.less；组件侧 less 用 ../../../shared/constants/... 引用
    data/                       # valorantMap.ts、mapsCatalog、agentsCatalog 等
  assets/
```

- 路径别名：`@/*` → `src/*`（`vite.config.ts` + `tsconfig.app.json`）。域内与跨域优先 `@/features/...`、`@/shared/...`。
- `npm run map:gen` 输出：`src/shared/data/valorantMap.ts`（见 `scripts/MAP_SVG_CONVENTIONS.md`）。

## 边界约定（避免循环依赖）

1. **依赖方向**：`features/*` 可依赖 `shared/*`；`shared` 不依赖具体 `features`。
2. **timeline vs keyframes**：时间线域为轨道与播放外壳；关键帧域为详情编辑 UI。数据与 store 仍在 `shared` 直至进一步拆分。
3. **shell vs tactical-panels**：壳管槽位与拖拽；左右栏业务内容在 `tactical-panels`。
4. **地图数据**：`shared/data/valorantMap.ts` 等为单一数据源。

## 迁移策略（后续增量）

- 新文件优先落在对应 `features/<域>/` 或 `shared/`。
- 若将某段逻辑从 `shared` 下沉到单域，保持 `shared` 不反向 import 该域。

## 验收

- `App.tsx` 的 import 体现域层级。
- `pnpm run build` 通过。
- `shared` 内不出现对 `features/...` 的 import。
