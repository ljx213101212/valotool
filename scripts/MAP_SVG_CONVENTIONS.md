# 战术地图 SVG 命名约定（map_gen）

源文件默认：`src/assets/maps/split.svg`。根下可用 `<g id="map">` 包裹整块地图内容（可选）。

## 四大分组（均在 `map` 内或 SVG 根下可被 `getElementById` 找到）

| 分组 `id` | 用途 | 子元素约定 |
|-----------|------|------------|
| `walls` | 墙/障碍边线（视野遮挡、碰撞） | 仅 `<line>`。每条线建议 `id="wall-{序号}"`，**禁止空格**（勿用 `Line 1`）。 |
| `walkable_region` | 地面可走区域 | 若干闭合 `<path>`（`d` 以 `Z`/`z` 结束）。主地面可用 `id="walkable"`。 |
| `boxes` | 可跳上的箱子顶面可走区域 | 若干闭合 `<path>`，建议 `id="box-{序号}-walkable"`。 |
| `areas` | 安包/逻辑区（仅多边形） | 仅包点轮廓使用 **`id` 以 `site-` 开头**，例如 `site-a`、`site-b`。装饰文字、字母矢量等使用 `id="label-*"` 或放到单独 `g id="labels"`，**不要**以 `site-` 开头，避免被写入 `TacticalMap.areas`。 |

## 绘制顺序建议

为兼顾观感：可先铺 `walkable_region` 与 `boxes`，再画 `walls`，最后叠 `areas` 与 UI（导出时按 Figma 图层顺序即可）。

## 路径 `d` 格式

生成脚本当前解析 **绝对命令**：`M`、`L`、`H`、`V`、`Z`（及 `M` 后连续的隐式 `L` 点对）。复杂曲线（`C` 等）未实现，需先在编辑器中转为折线/简化为直线段再导出。

## 数据流

运行 `npm run map:gen` 会读取上述 SVG，生成 `src/data/valorantMap.ts` 中的 `TacticalMap`：`walls`、`walkableFloor`、`boxWalkable`、`areas`、`bounds`。
