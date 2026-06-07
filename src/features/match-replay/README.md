# match-replay（关键帧战术复盘 · PoC）

验证产品新方向的隔离 PoC：**导入真实 Riot 对局数据 → 在官方小地图上还原关键时刻**，
取代「手动摆点 / 模拟技能连锁」的沙盘玩法。完全独立，不依赖也不影响主 App。

## 查看

```
npm run dev
# 浏览器打开 http://localhost:5173/?poc=replay
```

`?poc=replay` 由 `src/main.tsx` 识别；无此参数时渲染原有 App。

## 数据管线

0. **数据来源抽象 `data/matchSource.ts`**：视图只消费 `MatchSource` 接口（`listMatches` + `getMatch`），
   与具体来源解耦。实现：
   - `sampleFileSource.ts` —— ✅ 样例源（当前默认）。
   - `officialApiSource.ts` + `officialMatchAdapter.ts` —— 🟡 官方 VAL-MATCH-V1 源（经后端代理 `worker/val-proxy.ts`）。
     adapter 把官方 DTO（`puuid`/`timeSince*`/无顶层 kills）规整为领域模型，**已单测**（`officialMatchAdapter.test.ts`，
     `npx tsx --test`）；网络层需 Production Key + RSO + 部署代理后联调。
   - `LocalClientSource`（本地 token，过渡）—— 待实现。
   详见 `docs/valorant-data-access.md`。
1. **对局数据**：Riot `match-details` 响应（样例在 `public/sample/competitive-ascent.json`，
   来自 techchrism/valorant-api-docs 的脱敏 fixture：玩家名/英雄已打码，但**坐标真实自洽**）。
   字段类型见 `types.ts`（官方 schema 的忠实子集）。
2. **地图标定**：`mapCalibration.ts` 内置全部 12 张图的 `displayIcon` + 4 个标定参数
   （源自 valorant-api.com /v1/maps）。坐标变换（注意游戏 x/y 与图片互换）：
   ```
   normX = location.y * xMultiplier + xScalarToAdd
   normY = location.x * yMultiplier + yScalarToAdd
   ```
3. **关键时刻派生**：`deriveMoments.ts` 把一回合拆成有序帧——每次击杀一帧 + 下包/拆包各一帧，
   每帧携带该瞬间的全员存活位置快照（`playerLocations` / `plantPlayerLocations` / `defusePlayerLocations`）。
4. **渲染**：`MatchReplayPoc.tsx`（react-konva）——官方小地图为底，叠加 token、朝向、击杀连线、装置标记。

## 关键现实（决定形态）

Riot API **不提供逐帧/逐秒连续轨迹**，只在击杀/下包/拆包**瞬间**记录全员坐标。
因此产品是「关键决策节点复盘」，而非「连续录像回放」。

## 已知边界

- 脱敏 fixture 的 `characterId` 被打码，查不到真实 agent → token 降级为队伍色 + 玩家尾号；
  接真实数据后 `agentUuidMap.ts` 会命中，可换成英雄头像。
- 朝向箭头（viewRadians）为近似可视化。
- 仅渲染单帧快照；帧间无插值（数据本身不支持）。

## 下一步

- 用 OpenSpec 立项 `import-match-and-replay-keyframes`，把数据模型与视图正式纳入 specs。
- 真实数据接入：官方 Production Key（合规）或本地客户端 token（灰色地带）二选一。
- 视觉：token 换英雄头像、击杀热力图、回合经济条、A/B 点进攻方向统计。
