# Design

## 包边界

录入工具有重依赖（视频下载、ffmpeg、LLM、OCR），**不能污染要打进小程序的 `lineup-content`**。故独立成 `packages/lineup-ingest`，只「生产」，产物写回 `lineup-content`。

## 中间表示（IR）：逐级富化

不直接生成 `Lineup`，而是生成超集 `DraftLineup`（字段全可选 + 溯源 + 置信度 + 审核态）。管线各阶段渐进富化，人审通过后由 `promote` 塌缩成合法 `Lineup`。好处：可观测、可干预、可隔离（草稿不污染正式数据）。

阶段产物链：`SourceVideo → RawCapture → Segment[] → CapturedSegment → DraftLineup → (人审) → Lineup`。

## 幂等与可恢复

每阶段工件落盘（视频、帧、接触表、staging JSON），存在即跳过。限流/崩溃重跑不重烧带宽与 token。

## 取帧：从「猜 3 帧」到「候选 + 人选」

- **试过且否决**：ffmpeg `scene` 检测取关键帧。点位视频是连续第一人称录像，站位→瞄准→投掷一镜到底**无剪辑硬切**，scene 几乎不触发、全回退均匀采样 → 失效。根因：stand/aim/effect 是**游戏状态**（人站定/准星到位/技能落地）定义的语义时刻，不是视觉切变。
- **现方案**：capture **不预先指派**三帧。按 1fps 抽整段候选帧，再用同批帧拼「接触表」montage（每段一张，格子↔候选 1:1，`atSec = startSec + i`）。人审从接触表点选 stand/aim/effect。
- **智能预选**留给 VLM（看得懂游戏状态），作为叠加增强，而非 scene 检测。

## 抽取：hybrid，硬字段确定性来

`side`/`site` 由现有 `parseQuery` 从标题确定性抽取（闭词表+拼音，复用而非重造），软字段（purpose/technique/origin/target）交 LLM extractor。好处：少烧 token、把幻觉面缩到最小。`LlmExtractor` 接口隔离具体模型，`MockExtractor` 供打通/测试/eval 注入。

非点位段（如「假打a」「福利」）与无 side 字样的穿点，由 warning 如实标注，交人审/软层处理，不强行编造。

## 出口：复用现有工具链

`promote` 把审核通过的草稿经 `lineupSchema` 校验后，按 `{map}-{agent}.json` 合并进 `data/lineups`，并把选中帧落为 `raw-images/{id}__{role}.png`，交棒现有 `ingest-images`。预检 `MUST_LEARN_CAP`。不另造图片处理与校验。

## B 站采集

`yt-dlp --cookies-from-browser chrome` 过 412 风控（无 cookie 必被挡）。仅下载视频流（抽帧不需音轨），`ffprobe` 取时长。

## 待决 / 风险

- 真实 LLM extractor（DeepSeek，便宜中文）与 OCR（OCR 在人审**选定帧后**再跑，不在候选全集上跑）。
- 候选帧 PNG 偏大（~669M/视频），可改 JPG 省 ~10x。
- 版权：帧仅作 bootstrap，正式上线前热门点位自录。
