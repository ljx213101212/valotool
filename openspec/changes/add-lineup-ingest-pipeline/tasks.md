## 1. 采集源与契约

- [x] 1.1 `SourceVideo` zod 契约（bvid/平台/url/creator/creatorUid/recordedPatch/hints/credit/手抄 segments）。
- [x] 1.2 首批真实采集源 `sources/sova.json`（无敌猎枭王 ascent/breeze/haven 三图，64 段）。
- [x] 1.3 `check:sources` 校验脚本（zod safeParse + 报错指明字段）。
- [ ] 1.4 扩充采集源覆盖更多角色/地图（向 100–300 条目标推进）。

## 2. 管线骨架

- [x] 2.1 IR 类型：`RawCapture`/`Segment`/`CapturedSegment`/`FrameCandidate`/`DraftLineup`/`Provenance`/`PipelineCtx`。
- [x] 2.2 编排 `runSource`：fetch → segment →（capture → extract）* → stage。
- [x] 2.3 各 stage 签名 + `MockExtractor` 占位；`typecheck`(strict) 通过。
- [x] 2.4 CLI `run <sources.json> [bvid]`，按 bvid 单跑。

## 3. fetch + capture（已端到端实跑）

- [x] 3.1 `adapters/bilibili.download`：`yt-dlp --cookies-from-browser` 过 412 风控，仅视频流，`ffprobe` 取时长，幂等。
- [x] 3.2 `segment`：优先手抄时间轴切片（endSec 由下一段推），章节/自动为 fallback。
- [x] 3.3 `capture`：1fps 候选帧 + 同批帧拼接触表，格子↔候选 1:1，不预指派三帧，幂等。
- [x] 3.4 ascent 实跑验证：65M mp4、845 候选帧、29 接触表、29 草稿落 staging。
- [ ] 3.5（可选）候选/接触表改 JPG 省 ~10x 磁盘。

## 4. extract（hybrid）

- [x] 4.1 复用 `parseQuery` 从标题确定性抽 side/site（ascent 24/29 命中）；溯源写入 provenance。
- [x] 4.2 `LlmExtractor` 接口 + `prompts/extract-lineup`；OCR 容错跳过不阻断。
- [ ] 4.2 接真实 LLM extractor（DeepSeek/通义）填软字段，补回无 side 字样穿点。
- [ ] 4.3 OCR 接入：在人审**选定帧后**对选中帧跑，不在候选全集上跑。

## 5. 出口 promote

- [ ] 5.1 `promote`：staging 已 approved 草稿 → `lineupSchema` 校验 → 合并进 `data/lineups/{map}-{agent}.json`。
- [ ] 5.2 选中帧落 `raw-images/{id}__{role}.png`，交棒现有 `ingest-images`。
- [ ] 5.3 预检 `MUST_LEARN_CAP`（每 {map,agent} must-learn ≤ 5）。

## 6. 人审 UI

- [ ] 6.1 读 staging + 接触表点格子选 stand/aim/effect、改字段、approve/reject 写回。

## 7. 测试（还 TDD 欠债，11/11 通过）

- [x] 7.1 `segment` 手抄时间轴切片单测（endSec 推导、末段取时长、无时间轴抛错）。
- [x] 7.2 `capture` 候选 `atSec = startSec + i` 映射单测（抽出纯函数 `toCandidates`）。
- [x] 7.3 `sourceFileSchema` 校验单测（合法/非法 bvid/缺 credit/错 platform）。
- [x] 7.4 `extract` parseQuery 硬字段集成测（命中 side/site + 未命中 side 的 warning）。
- [ ] 7.5 后续新增功能改为**先写测试**（promote/真 extractor 等）。

## 8. 规格同步

- [x] 8.1 本 change 的 `specs/lineup-ingestion/spec.md` 增量。
- [ ] 8.2 archive 时把 delta 同步进 `openspec/specs/`。
