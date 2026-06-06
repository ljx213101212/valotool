## 伤害技能资料与分类

本规格记录 Valorant 伤害技能的资料来源、战术板 UI family 分类，以及本期支持范围。资料核验日期：2026-06-06。

### 数据来源

基础资料来自 Valorant Wiki 对各技能的 PC 平台数据页；再生甲与系统级血甲资料见 `specs/damage/spec.md`。

常用来源：

- Valorant Wiki, `Aftershock`: <https://valorant.fandom.com/wiki/Aftershock>
- Valorant Wiki, `Incendiary`: <https://valorant.fandom.com/wiki/Incendiary>
- Valorant Wiki, `Orbital Strike`: <https://valorant.fandom.com/wiki/Orbital_Strike>
- Valorant Wiki, `Mosh Pit`: <https://valorant.fandom.com/wiki/Mosh_Pit>
- Valorant Wiki, `FRAG/ment`: <https://valorant.fandom.com/wiki/FRAG-ment>
- Valorant Wiki, `Nanoswarm`: <https://valorant.fandom.com/wiki/Nanoswarm>
- Valorant Wiki, `Blaze`: <https://valorant.fandom.com/wiki/Blaze>
- Valorant Wiki, `Hot Hands`: <https://valorant.fandom.com/wiki/Hot_Hands>
- Valorant Wiki, `Boom Bot`: <https://valorant.fandom.com/wiki/Boom_Bot>
- Valorant Wiki, `Blast Pack`: <https://valorant.fandom.com/wiki/Blast_Pack>
- Valorant Wiki, `Paint Shells`: <https://valorant.fandom.com/wiki/Paint_Shells>
- Valorant Wiki, `Showstopper`: <https://valorant.fandom.com/wiki/Showstopper>
- Valorant Wiki, `Shock Bolt`: <https://valorant.fandom.com/wiki/Shock_Bolt>
- Valorant Wiki, `Hunter's Fury`: <https://valorant.fandom.com/wiki/Hunter%27s_Fury>
- Valorant Wiki, `Snake Bite`: <https://valorant.fandom.com/wiki/Snake_Bite>
- Valorant Wiki, `Special Delivery`: <https://valorant.fandom.com/wiki/Special_Delivery>
- Valorant Wiki, `Guided Salvo`: <https://valorant.fandom.com/wiki/Guided_Salvo>
- Valorant Wiki, `Armageddon`: <https://valorant.fandom.com/wiki/Armageddon>
- Valorant Wiki, `Trailblazer`: <https://valorant.fandom.com/wiki/Trailblazer>
- Valorant Wiki, `Turret`: <https://valorant.fandom.com/wiki/Turret>
- Valorant Wiki, `Blade Storm`: <https://valorant.fandom.com/wiki/Blade_Storm>
- Valorant Wiki, `Overdrive`: <https://valorant.fandom.com/wiki/Overdrive>
- Valorant Wiki, `Miks`: <https://valorant.fandom.com/wiki/Miks>
- Valorant Wiki, `Veto`: <https://valorant.fandom.com/wiki/Veto>

### UI / 逻辑 family

| Family | 说明 | 本期支持 |
| --- | --- | --- |
| `instant-area` | 确认后按圆形/线形/胶囊区域立即结算一次伤害 | 支持 MVP |
| `delayed-area` | 放置后等待 windup/delay，再按区域结算一次或一组爆炸 | 先分类，后续做 UI 结算 |
| `persistent-area` | 在持续时间内按 tick / interval 多次造成伤害 | 先分类，后续做 UI 结算 |
| `linear-beam` | 直线/柱体/光束命中，通常有长度和半径 | 先分类，后续做 |
| `projectile-direct` | 投射物命中、追踪物、控制物直接咬/爆炸 | 先分类，后续做 |
| `weapon-equip` | 技能召唤武器或准武器，涉及命中部位、距离、射速 | 先分类，后续做 |
| `compound` | 伤害 + 位移 / 震荡 / 脆弱 / 治疗 / 对象生命等复合行为 | 本期只记录伤害部分 |
| `decay-or-nonlethal` | decay、detain、nullify、纯 debuff 或击杀流程，不是普通伤害 | 不作为本期伤害实现 |

### 本期建议优先落地的代表技能

为了验证血甲管线而不是一次吞下所有技能，第一批实现以下代表 family：

1. `instant-area`: Sova `Shock Bolt`，圆形范围、中心到边缘衰减，最大 75。
2. `delayed-area`: Gekko `Mosh Pit`，3 秒 windup，持续 DoT 后爆炸；本期只记录数据，不开放 UI 伤害结算。
3. `persistent-area`: Brimstone `Incendiary` / Killjoy `Nanoswarm`，圆形持续区域，按 tick 推导伤害；本期只记录数据，不开放 UI 伤害结算。

其他技能先完成资料和分类，若其 family 未实现则在 UI 中标记为暂不支持伤害结算。

### 伤害技能资料表

| Agent | Ability | Family | 伤害资料摘要 | 本期状态 |
| --- | --- | --- | --- | --- |
| Breach | Aftershock | delayed-area / linear-area | 10m 长、3m 半径；2.2s windup；80/tick，2 ticks，总 160 | 分类，暂不支持 |
| Brimstone | Incendiary | persistent-area | 半径 4.5m；1/tick，60 ticks/s；约 420-465 总伤害；8s 总时长 | 分类，暂不支持 |
| Brimstone | Orbital Strike | persistent-area | 半径 9m；2s windup；20/tick，6.67 ticks/s；约 400-500 总伤害 | 分类，暂不支持 |
| Gekko | Mosh Pit | delayed-area / persistent-area | 半径 inner 5.5m / outer 6.2m；3s windup；DoT 总 30；爆炸 50/tick inner、25/tick outer，3 ticks | 分类，暂不支持 |
| KAY/O | FRAG/ment | persistent-area / pulsed-area | inner 1m / outer 4m；0.5s windup；25-60/tick，4 ticks，总 100-240 | 分类，暂不支持 |
| Killjoy | Nanoswarm | persistent-area | 半径 4.5m；0.5s damage delay；1/tick，45 ticks/s，4s，总 180 | 分类，暂不支持 |
| Killjoy | Turret | weapon-equip / autonomous | 0-20m: 8/shot，20-35m: 6/shot，35m+: 4/shot；3 发 burst | 分类，暂不支持 |
| Phoenix | Blaze | persistent-line | 线性火墙；1/tick，30 ticks/s，8s，总 225-240；Phoenix 自身治疗而非受伤 | 分类，暂不支持 |
| Phoenix | Hot Hands | persistent-area | 半径 4.5m；1/tick，60 ticks/s，4s，总 195-240；Phoenix 自身治疗而非受伤 | 分类，暂不支持 |
| Raze | Boom Bot | projectile-direct / autonomous | 2m inner / 6m outer；爆炸 30-80；只伤敌人 | 分类，暂不支持 |
| Raze | Blast Pack | compound / delayed-area | 1.5s arming；armed 后 20-50；同时有击退/位移 | 分类，暂不支持 |
| Raze | Paint Shells | delayed-area / multi-explosion | initial outer 5.5m，子雷 outer 5.25m；每次爆炸 1-55，中心到边缘衰减 | 分类，暂不支持 |
| Raze | Showstopper | projectile-direct / area | 爆炸伤害 30-150 | 分类，暂不支持 |
| Skye | Trailblazer | projectile-direct / compound | 直接命中 30；同时造成 2.5-4s 震荡 | 分类，暂不支持 |
| Sova | Shock Bolt | instant-area | inner 1.5m / outer 4m；1-75，中心到边缘衰减 | 支持候选 |
| Sova | Hunter's Fury | linear-beam | 66m 长、1.76m 半径柱体；每发 80；3 charges | 分类，暂不支持 |
| Tejo | Special Delivery | delayed-area / compound | inner 1.25m / outer 5.25m；0.9s windup；20-35；2.5s 震荡 | 分类，暂不支持 |
| Tejo | Guided Salvo | delayed-area / pulsed-area | inner 2.5m / outer 4.5m；1.25s windup；65 inner / 50 outer per tick，3 ticks | 分类，暂不支持 |
| Tejo | Armageddon | persistent-line / sequential-area | 12m 宽、32m 长，16 segments；60/tick，每 segment 4 ticks | 分类，暂不支持 |
| Viper | Snake Bite | persistent-area / compound | 半径 4.5m；1/tick，12.5 ticks/s，6.5s；约 76-79，总计受 Vulnerable 影响约 152-158 | 分类，暂不支持 |
| Jett | Blade Storm | weapon-equip | 5 blades；50 body，head x3，legs x0.85 | 枪械/部位系统后续做 |
| Neon | Overdrive | weapon-equip / beam | 0-20m 18，20-42m 18-10，43m+ 10；head x3，legs x0.85；20/s | 枪械/部位系统后续做 |
| Chamber | Headhunter | weapon-equip | 技能武器，需枪械/部位/距离系统 | 后续做 |
| Chamber | Tour De Force | weapon-equip | 技能武器，需枪械/部位/距离系统 | 后续做 |

### 非普通伤害或本期不纳入的相关能力

- Decay / Vulnerable / debuff-only 能力：Astra `Gravity Well`、Clove `Meddle`、Fade `Seize` / `Nightfall`、Iso `Undercut`、Viper 毒幕/毒云/大招、Vyse `Razorvine` 等先不作为直接伤害结算。
- Deadlock `Annihilation`、Gekko `Thrash` 等强控制/处决类能力不按普通 damage event 实现。
- Miks 当前技能资料显示为治疗、震荡、buff、烟、击退/慢速/耳聋，没有普通伤害技能。
- Veto 当前技能资料显示为传送、控制/拦截、能力压制/形态强化，没有普通伤害技能。

### 配置要求

每个可配置伤害技能至少需要：

- `agentId`
- `slot`
- `abilityName`
- `family`
- `supportStatus`: `supported` / `unsupported`
- `damageShape`: circle / line / beam / sequence / projectile / weapon
- `timing`: instant / windup / duration / ticks
- `targetRule`: enemies / allies / self / all
- `friendlyFire`
- `damageValues`
- `source`: URL + verifiedAt

### UI 复用要求

- `instant-area`: 鼠标圆心预览，左键确认，Esc 取消。
- `instant-area`: 确认后只保留关键帧中的瞬发技能施放与伤害/击杀事件，不在地图上常驻技能 tag 或伤害区域。
- `delayed-area`: 放置后创建技能实例和将来的伤害事件；地图可显示 windup/爆炸时间。
- `persistent-area`: 放置后创建持续区；伤害按 playhead 时间推导，不靠实时 interval 改写状态。
- unsupported family：仍可显示技能 token，但不能 silently apply damage；需要在操作入口提示该伤害行为暂未支持。
