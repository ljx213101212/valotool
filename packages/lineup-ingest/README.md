# @valotool/lineup-ingest

把 B 站点位教学视频半自动录入成结构化点位。把人从「创作者」变「审核员」。

## 管线

```
sources/*.json (SourceVideo[])
  └─ fetch    下载视频 + 章节 + AI字幕          (adapters/bilibili, yt-dlp)
  └─ segment  切段: 手抄 > 章节 > gap分段 > VLM语义  (stages/segment)
  └─ capture  1fps抽候选帧 + 拼接接触表           (adapters/ffmpeg)
  └─ extract  parseQuery锁side/site + VLM抽软字段 + VLM预选帧
  └─ stage    写 staging/<bvid>.json（待人审）
        │
        └─ 人审 → promote → lineup-content/data
```

中间表示是 `DraftLineup`（Lineup 超集 + 溯源 + 置信度 + 审核态）；人审通过才塌缩成合法 `Lineup`。

## 快速开始

```bash
# 1. 配置 VLM（智谱 glm-4v-flash，OpenAI 兼容，免费额度）
#    在仓库根目录 .env.local 中填写：
#      INGEST_EXTRACTOR=vlm
#      VLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
#      VLM_MODEL=glm-4v-flash
#      VLM_API_KEY=<你的key>

# 2. 准备采集源（已有手抄时间轴）
pnpm --filter @valotool/lineup-ingest check:sources

# 3. 跑全链路（一条视频）
npx tsx packages/lineup-ingest/src/cli.ts run packages/lineup-ingest/sources/sova.json

# 4. 只跑指定 bvid
npx tsx packages/lineup-ingest/src/cli.ts run packages/lineup-ingest/sources/sova.json BV1Tz4y1e7NK

# 5. 启动人审 UI
pnpm --filter @valotool/lineup-ingest review

# 6. 推广通过审核的草稿到正式数据
pnpm --filter @valotool/lineup-ingest promote
```

## segment 四级回退

优先级从高到低：

| 级别 | 来源 | 适用场景 |
|------|------|---------|
| 1. 手抄时间轴 | `sources/*.json` 里的 `segments` | 人工录入，最精确 |
| 2. 视频章节 | yt-dlp `--dump-json` 提取 | B站视频自带章节 |
| 3. gap 分段 | 字幕停顿 >15s 处切分 | 字幕有明显停顿的视频 |
| 4. VLM 语义分段 | 字幕全文发给 VLM 识别点位边界 | gap 质量差时兜底，兼容任意主播风格 |

VLM 分段仅在 gap 分段结果差（段数≤2且>60s，或存在>60s长段）时触发，节省 token。

## extract 三件事

对每段同时做：

1. **硬字段**：`parseQuery` 从段标题确定性抽 `side`/`site`
2. **软字段**：VLM 读接触表（1fps 拼图），抽 `abilitySlot`/`technique`/`purpose`/`origin`/`target`/`timing`
3. **帧预选**：VLM 读采样帧（最多 5 张），自动指派 stand/aim/effect 作为人审默认值

## 人审帧角色

- **必填**（approve 闸门）：stand / aim / effect
- **选填**（审核辅助）：agent-specific 角色（如 Jett 的 dash_direction、smoke_landing 等），不指派不阻塞 approve

## 无手抄时间轴时的新视频录入

如果视频没有现成的 `segments`，可以在 source JSON 中省略 `segments` 字段。管线会自动回退到章节→字幕→VLM 分段：

```json
[
  {
    "id": "BV1dDMw6sE65",
    "platform": "bilibili",
    "url": "https://www.bilibili.com/video/BV1dDMw6sE65",
    "title": "新手一遍就能学会的捷风进点教程（微风岛屿）",
    "creator": "糖浆_OvO",
    "hints": { "map": "breeze", "agent": "jett" },
    "credit": "点位演示来源：B站 @糖浆_OvO（BV1dDMw6sE65）"
  }
]
```

## 时间轴录入

把 B站视频简介里的时间轴贴到文本文件，生成带完整元数据的 `SourceVideo[]`：

```bash
pnpm --filter @valotool/lineup-ingest timeline path/to/timeline.txt --source \
  --bvid BV1Tz4y1e7NK \
  --title "捷风 Ascent 进点合集" \
  --creator "UP 主名" \
  --map ascent \
  --agent jett \
  --creator-uid 107743511 \
  --patch 12.11 \
  --note "可选录入备注" \
  --output sources/jett.json
```

## 其他命令

```bash
pnpm --filter @valotool/lineup-ingest check:sources   # 校验 sources/*.json
pnpm --filter @valotool/lineup-ingest typecheck       # 类型检查
pnpm --filter @valotool/lineup-ingest test            # 跑测试
pnpm --filter @valotool/lineup-ingest eval            # 跑抽取评估
```

## 环境变量

参见仓库根目录 `.env.example`。核心变量：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `INGEST_EXTRACTOR` | `mock` 或 `vlm` | `mock` |
| `VLM_BASE_URL` | VLM API 地址 | 智谱 `https://open.bigmodel.cn/api/paas/v4` |
| `VLM_MODEL` | 模型名 | `glm-4v-flash` |
| `VLM_API_KEY` | API 密钥 | —（mock 模式下不需要） |
| `INGEST_COOKIES_BROWSER` | yt-dlp 读 cookie 的浏览器 | `chrome` |
