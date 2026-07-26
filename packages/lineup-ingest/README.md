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

### 0. 前置：油猴抓时间轴（推荐）

安装 `scripts/bilibili-timeline-capture.user.js`（Tampermonkey），打开 B站视频页：

1. **F9** 呼出面板，展开「元信息」区，填写地图、英雄
2. 边播边按 **F8** 在每个点位处打点 + 填标题
3. 点「📋 复制 SourceJSON」→ 粘贴保存为 `sources/<bvid>.json`

油猴导出的 JSON 已是 `SourceVideo` 契约格式，可直接喂给管线。

> 如果不想装油猴，也可用 CLI 方式手动写时间轴文本（见下方「备选：CLI 时间轴」）。

### 1. 配置 VLM（可选，无 VLM 时管线仍可跑，软字段留空待人审）

仓库根目录 `.env.local`：
```bash
INGEST_EXTRACTOR=vlm
VLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
VLM_MODEL=glm-4v-flash
VLM_API_KEY=<your key>
```

### 2. 跑管线

```bash
# 校验 sources
pnpm --filter @valotool/lineup-ingest check:sources

# 跑全链路（fetch→segment→capture→extract→stage）
pnpm --filter @valotool/lineup-ingest ingest sources/<bvid>.json

# 只跑指定 bvid
pnpm --filter @valotool/lineup-ingest ingest sources/<bvid>.json BV1Tz4y1e7NK
```

### 3. 人审

```bash
pnpm --filter @valotool/lineup-ingest review
```

浏览器打开 `http://localhost:5180`，逐条审核草稿，指派帧、补字段，点 approve。

### 4. 产出 meta + 上传图片

```bash
# 将 approved 草稿塌缩成正式 Lineup，产出 data/lineups/<map>-<agent>.json
pnpm --filter @valotool/lineup-ingest promote

# png→webp 并上传 COS（需要 CDN_BASE 环境变量）
CDN_BASE=<你的CDN地址> pnpm --filter @valotool/lineup-content ingest
```

---

### 备选：CLI 时间轴（不用油猴）

把 `mm:ss 标题` 格式的时间轴粘进 `sources/_timeline.txt`，存盘后运行：

```bash
pnpm --filter @valotool/lineup-ingest timeline sources/_timeline.txt --source \
  --bvid BV1Tz4y1e7NK --title "捷风 Ascent 进点合集" \
  --creator "管家4型2号" --map ascent --agent jett \
  --creator-uid 107743511 --patch 12.11 \
  --output sources/jett.json
```

## 分段（segment）

四级回退，按优先级从高到低：

| 级别 | 来源 | 说明 |
|------|------|------|
| 1 | 手抄时间轴 | `sources/*.json` 里的 `segments` 字段 |
| 2 | 视频章节 | yt-dlp `--dump-json` 提取的 B 站章节 |
| 3 | gap 分段 | 字幕停顿 >15s 处切分 |
| 4 | VLM 语义分段 | 字幕全文发给 VLM 识别点位边界 |

VLM 分段仅在 gap 结果差（段数≤2且>60s，或存在>60s 长段）时触发，节省 token。如果 source JSON 中省略 `segments`，管线自动走章节→字幕→VLM 回退。

## 抽取（extract）

对每段同时做三件事：

1. **硬字段** — `parseQuery` 从标题确定性抽 `side`/`site`
2. **软字段** — VLM 读接触表（1fps 拼图），抽 `abilitySlot`/`technique`/`purpose`/`origin`/`target`/`timing`
3. **帧预选** — VLM 采帧（最多 5 张），指派 stand/aim/effect 作为人审默认值

## 人审

- **必填**：stand / aim / effect（缺一不可 approve）
- **选填**：agent-specific 角色（如 Jett 的 dash_direction），不指派不阻塞 approve

## 其他命令

```bash
pnpm --filter @valotool/lineup-ingest typecheck       # 类型检查
pnpm --filter @valotool/lineup-ingest test            # 跑测试
pnpm --filter @valotool/lineup-ingest eval            # 跑抽取评估
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `INGEST_EXTRACTOR` | `mock` 或 `vlm` | `mock` |
| `VLM_BASE_URL` | VLM API 地址 | 智谱 |
| `VLM_MODEL` | 模型名 | `glm-4v-flash` |
| `VLM_API_KEY` | API 密钥 | —（mock 不需要） |
| `INGEST_COOKIES_BROWSER` | yt-dlp 读 cookie 的浏览器 | `chrome` |
