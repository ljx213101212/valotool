## Why

点位内容是本产品的命脉，但人工录入极慢：要先看懂别人视频、自己进游戏复现、再截图归类，一小时录不了几组。RAG 语义检索等差异化能力又依赖**至少 100–300 条**点位才有说服力。瓶颈在内容生产，不在前端。

破局思路：**把人从「创作者」变「审核员」**。B 站点位教学视频里，站位/瞄准/落点画面本就齐全——视频帧即素材，不必进游戏重录。用半自动管线把视频拆成带帧、带结构化字段、带溯源的**草稿**，人只做审核与微调。

> 说明：本 change 为**追溯补立**——实现先于 spec 完成（违反本仓库 OpenSpec 先行约定），现补齐规划artifact并将其作为后续 source of truth。

## What Changes

- 新增 **点位录入管线**能力：以结构化清单声明采集源（B 站视频 + 手抄时间轴），分阶段 `fetch → segment → capture → extract → stage` 产出审核草稿；工件落盘、幂等可恢复。
- 取帧采用 **1fps 候选帧 + 接触表**，不自动指派 stand/aim/effect，交人审选（曾试 ffmpeg 场景检测，连续游戏录像无硬切而失效，见 design）。
- 抽取走 **hybrid**：复用现有 `parseQuery` 从标题确定性抽 side/site，软字段交可替换的 LLM extractor（当前 `MockExtractor` 占位）。
- 草稿隔离在 `staging/`，经人审 `promote` 校验后才落入 `lineup-content` 的 `data/lineups` 与 `raw-images`，对接现有 `ingest`/`check`。
- 非目标（Non-goals）：真实 LLM/OCR 接入、人审 UI、promote 落库、单元测试（均列为 pending tasks，后续增量）、爬竞品小程序数据（明确禁止）。

## Capabilities

### New Capabilities

- `lineup-ingestion`：从 B 站点位视频半自动产出审核草稿的管线——采集源契约、分阶段幂等流水线、候选帧+接触表取帧、hybrid 结构化抽取、staging 隔离与人审出口。

### Modified Capabilities

- None。复用 `lineup-content-model` 的 `Lineup` schema / `parseQuery` / `validate` / `ingest-images` 作为输入与出口，不改其行为。

## Impact

- 新增 `packages/lineup-ingest/`（独立工具包，不打进小程序）：types/IR、pipeline、stages、extractors、adapters、`check:sources`/`typecheck` 脚本、首批真实采集源 `sources/sova.json`（3 图 64 段）。
- 运行期依赖本机 `yt-dlp` + `ffmpeg`（brew）；B 站风控需 `--cookies-from-browser`。
- `.work/`、`staging/` 为本地缓存（gitignore），不入库。
- 版权：当前用视频帧 bootstrap，正式上线前对热门点位改为自录素材；保留 provenance 致谢。
