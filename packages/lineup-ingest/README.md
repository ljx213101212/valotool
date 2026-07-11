# @valotool/lineup-ingest

把 B 站点位教学视频半自动录入成结构化点位。把人从「创作者」变「审核员」。

## 管线

```
sources/*.json (SourceVideo[])
  └─ fetch    下载视频/字幕/章节            (adapters/bilibili)
  └─ segment  切成单条点位（手抄时间轴优先）   ← 已实现
  └─ capture  抽 stand/aim/effect 三帧        (adapters/ffmpeg)
  └─ extract  parseQuery 锁 side/site + LLM 填软字段
  └─ stage    写 staging/<bvid>.json（待人审）  ← 已实现
        │
        └─ 人审 → promote → lineup-content/data + raw-images → 现有 ingest/check
```

中间表示是 `DraftLineup`（Lineup 超集 + 溯源 + 置信度 + 审核态）；人审通过才塌缩成合法 `Lineup`。

## 命令

```bash
pnpm --filter @valotool/lineup-ingest check:sources   # 校验 sources/*.json
pnpm --filter @valotool/lineup-ingest typecheck       # 类型检查
pnpm --filter @valotool/lineup-ingest ingest sources/sova.json   # 跑管线（外部 adapter 待实现）
```

## 时间轴录入

旧用法只把 `mm:ss 标题` 草稿解析为 `segments`，便于补进已有 source：

```bash
pnpm --filter @valotool/lineup-ingest timeline path/to/timeline.txt
```

使用 `--source` 会直接输出单视频 `SourceVideo[]` JSON，可保存到 `sources/<agent>.json` 后运行 `check:sources` 与 `ingest`。BVID 会生成标准 Bilibili URL 和来源致谢，不需要也不能手填 URL：

```bash
pnpm --filter @valotool/lineup-ingest timeline path/to/timeline.txt --source \
  --bvid BV1Tz4y1e7NK \
  --title "捷风 Ascent 进点合集" \
  --creator "UP 主名" \
  --map ascent \
  --agent jett \
  --creator-uid 107743511 \
  --patch 12.11 \
  --note "可选录入备注"
```

`--bvid`、`--title`、`--creator`、`--map`、`--agent` 为必填；`--creator-uid`、`--patch`、`--note` 为可选。地图和英雄必须使用项目已注册的 slug，且 `BV0000000000` 这类占位 BVID 会被拒绝。

`--output`（或 `-o`）可将输出写入文件而非 stdout：

```bash
# 输出到文件
pnpm --filter @valotool/lineup-ingest timeline draft.txt --source \
  --bvid BV1Tz4y1e7NK --title "标题" --creator "UP主" --map ascent --agent jett \
  --output sources/jett.json

# 或使用简写
pnpm --filter @valotool/lineup-ingest timeline draft.txt -o segments.json
```

## 现状

骨架已通。`segment`(手抄时间轴) / `stage` / `check:sources` 为真实现；
`fetch`/`capture`/OCR/真实 LLM extractor 为 TODO，`MockExtractor` 可打通全链。
