## 烟雾技能的相关数据

### 引用
https://liquipedia.net/valorant
https://valorant.fandom.com/wiki/


```
{
  "controllers": [
    {
      "agent_zh": "星礈",
      "agent_en": "Astra",
      "ability_zh": "星云",
      "ability_en": "Nebula",
      "radius_meters": 4.75,
      "diameter_meters": 9.50,
      "duration_seconds": 14.25,
      "type": "regular",
      "notes": "全游戏体积最大的圆球状烟雾。"
    },
    {
      "agent_zh": "暮蝶",
      "agent_en": "Clove",
      "ability_zh": "迷雾",
      "ability_en": "Ruse",
      "radius_meters": 4.00,
      "diameter_meters": 8.00,
      "duration_seconds": 12.25,
      "type": "conditional",
      "notes": "活着时持续12.25秒；死后状态下搓的烟持续时间会被拦腰砍至6.0秒。"
    },
    {
      "agent_zh": "幽影",
      "agent_en": "Omen",
      "ability_zh": "暗影之罩",
      "ability_en": "Dark Cover",
      "radius_meters": 4.10,
      "diameter_meters": 8.20,
      "duration_seconds": 15.00,
      "type": "regular",
      "notes": "尺寸适中。最新版本增加了即将消失时的内部视觉提示，且无法再挂在无碰撞墙体上做悬空单向烟（One-Way）。"
    },
    {
      "agent_zh": "炼狱",
      "agent_en": "Brimstone",
      "ability_zh": "空投烟弹",
      "ability_en": "Sky Smoke",
      "radius_meters": 4.15,
      "diameter_meters": 8.30,
      "duration_seconds": 19.25,
      "type": "regular",
      "notes": "全游戏持续时间最长的常规圆球烟。"
    },
    {
      "agent_zh": "海神",
      "agent_en": "Harbor",
      "ability_zh": "水盾",
      "ability_en": "Cove",
      "radius_meters": 4.50,
      "diameter_meters": 9.00,
      "duration_seconds": 15.00,
      "type": "shield",
      "notes": "水球烟，带护盾（680HP）。最新补丁修复后，即使护盾被中途击碎，水烟也会维持满完整的15秒。"
    },
    {
      "agent_zh": "蝰蛇",
      "agent_en": "Viper",
      "ability_zh": "毒雾",
      "ability_en": "Poison Cloud",
      "radius_meters": 4.50,
      "diameter_meters": 9.00,
      "duration_seconds": 12.00,
      "type": "fuel_based",
      "notes": "消耗满燃料最多维持12秒。可收回并二次扔出。走出烟雾会受到即时衰竭扣血。"
    }
  ],
  "others": [
    {
      "agent_zh": "捷风",
      "agent_en": "Jett",
      "ability_zh": "瞬云",
      "ability_en": "Cloudburst",
      "radius_meters": 3.35,
      "diameter_meters": 6.70,
      "duration_seconds": 2.50,
      "type": "tactical",
      "notes": "全游戏体积最小、持续时间最短的圆球烟。7.04版本从4.5秒大幅削弱至2.5秒。"
    },
    {
      "agent_zh": "零",
      "agent_en": "Cypher",
      "ability_zh": "战术网络",
      "ability_en": "Cyber Cage",
      "radius_meters": 3.00,
      "diameter_meters": 6.00,
      "duration_seconds": 7.00,
      "type": "cage",
      "notes": "中空的圆柱体烟笼。敌人穿过时会产生特定的单向限制音效。"
    },
    {
      "agent_zh": "不死鸟",
      "agent_en": "Phoenix",
      "ability_zh": "火墙",
      "ability_en": "Blaze",
      "radius_meters": null,
      "diameter_meters": null,
      "length_meters": 18.00,
      "duration_seconds": 8.00,
      "type": "wall",
      "notes": "长度约15-20米，战术板路径上限取18m。可通过鼠标摆动划出弧线。不死鸟穿过可回血。"
    },
    {
      "agent_zh": "霓虹",
      "agent_en": "Neon",
      "ability_zh": "高速通道",
      "ability_en": "Fast Lane",
      "radius_meters": null,
      "diameter_meters": null,
      "duration_seconds": 6.00,
      "type": "wall",
      "notes": "向前延伸50米的两道平行闪电光墙。专门为进点撕扯防线设计，属于窄道方向的线性视野阻隔。"
    },
    {
      "agent_zh": "海神",
      "agent_en": "Harbor",
      "ability_zh": "狂潮",
      "ability_en": "High Tide",
      "radius_meters": null,
      "diameter_meters": null,
      "length_meters": 18.00,
      "duration_seconds": 7.00,
      "type": "wall",
      "notes": "可摆动水墙，战术板一期用直线近似。长度与 Phoenix 火墙同量级。"
    },
    {
      "agent_zh": "蝰蛇",
      "agent_en": "Viper",
      "ability_zh": "毒幕",
      "ability_en": "Toxic Screen",
      "radius_meters": null,
      "diameter_meters": null,
      "length_meters": 13.00,
      "duration_seconds": 8.00,
      "type": "wall",
      "notes": "绿色毒墙，游戏内随燃料维持；战术板用固定 8 秒展示。"
    }
  ]
}

```

**实现备注**

- Cypher Cyber Cage：释放流程与球型烟相同，`ABILITY_EFFECT_META` 使用较小半径；地图可选 `smokeVariant: cage` 笼状样式。
- Phoenix Blaze / Harbor High Tide：`smoke-line-drawable`，鼠标拖拽画曲线。
- Viper Toxic Screen：`smoke-line-fixed-single` 笔直单线，长度 13m，放置交互同霓虹。
- Phoenix / Harbor 弯曲线烟：路径总长上限见各技能 `length_meters`（18m）。

