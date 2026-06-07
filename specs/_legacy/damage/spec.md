## 伤害与血甲系统

本规格记录 Valorant 战术板中“特工生命值 / 护甲 / 伤害事件”的产品语义。资料核验日期：2026-06-06。

### 数据来源

- Riot Games, `VALORANT Patch Notes 9.10`: <https://playvalorant.com/en-us/news/game-updates/valorant-patch-notes-9-10>
- Valorant Wiki, `Health`: <https://valorant.fandom.com/wiki/Health>
- Valorant Wiki, `Armor and Shield`: <https://valorant.fandom.com/wiki/Armor_and_Shield>
- Liquipedia VALORANT Wiki, `Regen Shields`: <https://liquipedia.net/valorant/Regen_Shields>

### 基础生命值

- 所有标准特工基础生命值为 `100 HP`。
- 标准手段不会提高基础最大生命值。
- Reyna / Clove 的 overheal 等额外生命属于后续 sustain / shield / overheal 系统，本期不实现。
- 当生命值降至 `0` 时，特工被视为 eliminated；战术板中生命值不得显示负数。

### 护甲类型

| 护甲 | 价格 | 初始护甲值 | 伤害吸收 | 再生池 | 本期语义 |
| --- | ---: | ---: | ---: | ---: | --- |
| 无甲 | 0 | 0 | 0% | 0 | 伤害全部进入 HP |
| 小甲 / Light Armor | 400 | 25 | 66% | 0 | 常规护甲，吸收至多 25 点 |
| 再生甲 / Regen Shield | 650 | 25 | 100% | 50 | 先以 25 点护甲全额吸收；受击后可从 50 点池恢复 |
| 大甲 / Heavy Armor | 1000 | 50 | 66% | 0 | 常规护甲，吸收至多 50 点 |

说明：

- Light / Heavy 的 `66%` 吸收来自 Valorant Wiki 的 Armor and Shield 表。
- Regen Shield 的 `25` 吸收、`50` 再生池、`100%` 吸收来自 Riot 9.10 patch notes；Liquipedia 同样确认其最大恢复到 25，并从 50 点 pool 中消耗。
- Riot 官方说明 Regen Shield 会在 “brief delay” 后恢复，但没有给出精确秒数或恢复速率。第三方社区存在“约 3 秒”的说法，但本项目不得把它写成已确认事实。

### 伤害应用规则

伤害事件统一使用 `rawDamage` 表示原始伤害。护甲处理后得到新的 `health` / `armor` / `regenPool`。

1. 无甲：`health -= rawDamage`。
2. Light / Heavy：
   - 护甲仍有值时，优先吸收 `rawDamage * 0.66`，最多不超过剩余护甲。
   - 未被护甲吸收的部分进入 health。
   - 如果护甲不足以吸收计算出的护甲份额，溢出伤害进入 health。
3. Regen Shield：
   - 当前护甲值大于 0 时，先由护甲以 `100%` 吸收，最多不超过当前护甲值。
   - 超出当前护甲值的伤害进入 health。
   - 受击会重置/打断其恢复等待状态。
4. 所有结果都必须 clamp：`health >= 0`、`armor >= 0`、`regenPool >= 0`。
5. 当 `health === 0` 时，`eliminated = true`。
6. 技能伤害造成 `health === 0` 时，关键帧必须自动追加一条由该伤害事件派生的击杀记录，写入击杀者、受害者以及伤害事件来源；删除该技能部署时，该派生击杀也必须随伤害事件一起移除。

### 再生甲恢复规则

本期数据模型需要支持 Regen Shield 恢复，但不把未核验的精确时间写死为游戏事实：

- 已核验语义：
  - 最大当前护甲为 `25`。
  - 初始再生池为 `50`。
  - 恢复消耗再生池。
  - 恢复不会超过当前护甲上限 `25`。
  - 受击后需要等待一段时间才开始恢复。
- 未核验精确数值：
  - 官方没有公布确切恢复延迟秒数。
  - 官方没有公布确切每秒恢复速率，或是否以固定 tick 方式恢复。
- 实现约束：
  - 纯逻辑 helper 可以接受 `delaySec` / `ratePerSec` 等配置用于测试和未来数据更新。
  - 默认产品数据不得声称拥有精确恢复秒数；需要在 UI/规格中标注该值未核验。
  - 如果后续需要完全自动播放真实再生甲恢复，必须先补充可信来源。

### 伤害来源类型

本期设计三类来源：

```ts
type DamageSource =
  | { type: 'ability'; abilityId: string; casterPlacementId: string; deploymentId?: string }
  | { type: 'weapon'; weaponId: string; hitRegion?: 'head' | 'body' | 'leg' }
  | { type: 'environment'; kind: 'fall' | 'out-of-bounds' | 'map-hazard' };
```

- `ability` 是本期唯一会实际产生伤害事件的来源。
- `weapon` 只保留类型边界，不实现枪械部位伤害、距离衰减或穿透。
- `environment` 只保留类型边界，不实现跌落 / 出界自动检测。

### 时间轴语义

- 特工血甲状态应从初始 combat state 和时间轴上的伤害事件推导得到。
- 播放头前进时，应用该时间点及之前的伤害事件。
- 播放头回退时，晚于播放头的伤害事件不得影响当前状态。
- 删除一个产生伤害的技能部署时，与该部署关联的伤害事件也必须从推导状态中移除。
- 删除一个产生致死伤害的技能部署时，与该部署关联的派生击杀记录也必须从关键帧中移除；手动击杀记录不得被误删。

### 地图 token UI 语义

- 地图 token 应优先保持可扫读，不常驻显示密集数字。
- 头像周围显示简洁生命值指示；护甲存在时显示小型护甲指示。
- exact HP / armor / regen pool 放在 hover、popover、detail drawer 或事件行里。
- eliminated 状态沿用现有地图 token 的淘汰视觉。
