# 无畏契约真实对局数据接入调研

> 调研日期 2026-06-07。服务于 OpenSpec change `import-match-and-replay-keyframes` 的 tasks 6.1。
> 结论先行：**官方合规接口足以驱动关键帧复盘，应作为主线；本地接口仅作个人/开发期临时手段。**

## 0. 决定性发现

官方 **VAL-MATCH-V1** 的 MatchDto **包含与本地接口几乎相同的坐标数据**：每次击杀的
`playerLocations`（puuid + `location{x,y}` + `viewRadians`）、`victimLocation`，以及回合级的
下包/拆包位置、经济、`abilityCasts`。多个官方 API 封装库（RiotWatcher `ValMatchApi`、
fightmegg/riot-api 的 `VAL_MATCH` 类型）均印证此结构。

→ 意味着：**关键帧复盘不必依赖灰色的本地接口**，可走完全合规的官方路线。这推翻了「只有本地接口能拿到位置」的假设。

## 1. 两条路线对比

| 维度 | 官方 Production Key（VAL-MATCH-V1） | 本地/非官方接口（客户端 token） |
|---|---|---|
| 位置数据 | ✅ playerLocations / victimLocation / 装置点 | ✅ 同等（结构几乎一致） |
| 合规性 | ✅ 官方授权 | ⚠️ ToS 灰色，Riot 容忍但不背书 |
| 谁能用 | 任意国际服玩家（按 puuid 查） | 仅「本机已登录的那个账号」自己的对局 |
| 准入门槛 | 需 Production Key 人工审批（无 personal key） | 无需审批 |
| 客户端要求 | 不需要游戏在跑 | **需游戏客户端在运行**（取 token/entitlement/version） |
| 商业化 | ✅ 可 | ❌ 基本不可（依赖每个用户本机） |
| 服务器/infra | 仅存对局数据，成本低 | 同样低（甚至可纯本地） |
| 中国服 | ❌ 不支持 | ❌ 不支持 |

## 2. 官方路线落地细节

**Key 政策**：Valorant **不提供 personal key**，只有 Production Key。审批看重「可演示的成品/原型 +
清晰的用户流程」——**我们已有可演示的复盘视图（`/replay`），正好是 Riot 想看到的东西**。审批周期约每周一批，
偶尔拖到 3 周。

**端点**（`GET /val/match/v1/...`）：
- `matches/{matchId}` —— 单局详情（含全部坐标数据，驱动复盘）。
- `matchlists/by-puuid/{puuid}` —— 玩家对局列表。
- `recent-matches/by-queue/{queue}` —— 近期 matchId（live 区近 10 分钟）。

**区域路由**：AMERICAS / ASIA / EUROPE / ESPORTS 等（NA/LATAM/BR 共享一套）；无 CN。

**RSO（Riot Sign-On）**：要按 puuid 查某玩家对局，需先拿到该玩家 puuid → 需 RSO 让用户用 Riot 账号登录授权。
RSO 仅对「已获批的 Production 应用」开放，获批后会收到 RSO 申请邀请。

**落地顺序**：① 拿现有 PoC + 一个能跑的站点去申请 Production Key → ② 获批后申请 RSO → ③ 用户 RSO 登录拿 puuid →
④ matchlist → match details → 复盘。

**风险**：审批可能被拒（业余项目、未上线）。缓解：把 PoC 做成可公开访问的 demo 站点，清晰展示用户流程。

## 3. 本地路线落地细节

**原理**：游戏运行时，客户端在本机暴露认证信息（lockfile / entitlements / ClientPlatform 头 / ClientVersion），
据此调用 Riot 的 pd/glz PVP 端点（与官方 match-details 同源数据）。需要一个本地程序（Electron/CLI）读取这些信息。

**ToS 与封号现实**（综合 Riot 支持页与社区 giorgi-o 的「Riot vs 第三方开发者社区」纪要）：
- 走**官方 API 数据**的 tracker（Tracker.gg、Blitz、Spike Stats 等）Riot 视为相对安全、长期容忍。
- **会封号的是**：读取受 Vanguard 保护的 `Valorant.exe` 进程内存、自动化/宏/作弊类。
- 读取本机 lockfile/调用本地 REST 端点本身，Riot 历来选择「不想让其工作就改 API」而非封号用户。
- 但这条线**没有官方背书**，Riot 可随时改动使其失效，且只能拉用户自己的对局、要求客户端在跑。

**适用**：个人使用、开发期联调、官方 Key 审批未过前的临时数据源。**不适合**作为面向广大用户的商业形态。

## 4. 建议

1. **主线走官方**：把 PoC 升级为可公开访问的 demo（哪怕只读样例数据），用它申请 Production Key → RSO。合规、可商业化、面向所有国际服用户。
2. **本地接口作过渡**：在等待审批期间，可做一个本地小工具用自己的账号拉真实对局喂给复盘视图，验证端到端体验。
3. **国服**：放弃，工具定位国际服。
4. **下一个可立即做的工程动作**：在数据层抽象出 `MatchSource` 接口（样例文件 / 官方 API / 本地接口三种实现可替换），让复盘视图与数据来源解耦——这样无论审批结果如何都不返工。

## 实现状态（本仓库）

数据来源经 `MatchSource` 抽象（`src/features/match-replay/data/`）：

| 文件 | 状态 |
|---|---|
| `matchSource.ts` | 接口 `MatchSource`（`listMatches`/`getMatch`）+ `MatchSummary` |
| `sampleFileSource.ts` | ✅ 样例源（当前默认） |
| `officialMatchAdapter.ts` | ✅ 官方→领域 adapter（puuid→subject、timeSince*→time、重建顶层 kills），**已单测** |
| `officialApiSource.ts` | 🟡 scaffold：调后端代理 + adapter；需 Key/RSO/代理后联调 |
| `worker/val-proxy.ts` | 🟡 scaffold：CF Worker 代理（持 Key 转发） |

**后端代理契约**（前端 `OfficialApiSource` 与 Worker 约定）：

```
GET /api/val/matchlist/:puuid  → 透传 Riot matchlists/by-puuid（{ history: [{matchId, gameStartTimeMillis, queueId}] }）
GET /api/val/match/:matchId    → 透传 Riot match details（原始官方 MatchDto，前端再 normalize）
```

**联调前置条件**：① Riot Production Key（拿现有 PoC demo 去申请）→ ② RSO 取目标玩家 puuid →
③ 部署 Worker（`wrangler secret put RIOT_API_KEY` + wrangler 加 `main`/assets 绑定 + `VAL_REGION`）。
adapter 已用 fixture 单测，故 Key 到位后主要风险只在网络/认证层。

## 来源

- [Riot Dev Portal · Valorant](https://developer.riotgames.com/docs/valorant)
- [Production Key Applications](https://support-developer.riotgames.com/hc/en-us/articles/22801383038867-Production-Key-Applications)
- [VAL-MATCH-V1 端点](https://developer.riotgames.com/api-details/val-match-v1)
- [RiotWatcher ValMatchApi](https://riot-watcher.readthedocs.io/en/latest/riotwatcher/Valorant/MatchApi.html) ·
  [fightmegg/riot-api 类型](https://github.com/fightmegg/riot-api/blob/master/src/%40types/index.ts)
- [Riot 支持 · 第三方应用](https://support-valorant.riotgames.com/hc/en-us/articles/38353516078227-Third-Party-Applications)
- [giorgi-o: Riot vs Valorant 第三方开发者社区](https://gist.github.com/giorgi-o/e0fc2f6160a5fd43f05be8567ad6fdd7)
- 本地接口端点参考：[valapidocs.techchrism.me](https://valapidocs.techchrism.me/)
