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

## 现状

骨架已通。`segment`(手抄时间轴) / `stage` / `check:sources` 为真实现；
`fetch`/`capture`/OCR/真实 LLM extractor 为 TODO，`MockExtractor` 可打通全链。
