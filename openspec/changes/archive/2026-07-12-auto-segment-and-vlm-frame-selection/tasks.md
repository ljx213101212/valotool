## 1. P0-1: 章节/字幕自动分段

- [x] 1.1 扩展 `bilibili.ts` download：用 yt-dlp 提取章节（`--dump-json`）和下载字幕（`--write-auto-subs`），产出 `RawCapture.chapters` 和 `subtitlePath`。
- [x] 1.2 实现字幕解析器：读 `.vtt`/`.srt`，按停顿（GAP_SEC=15s）切分为 `Chapter[]`。
- [x] 1.3 扩展 `segment.ts`：实现三级回退：手抄 > 章节 > 字幕自动分段 > 报错。
- [x] 1.4 写测试：章节分段、字幕分段、手抄优先、无信息回退。

## 2. P0-2: VLM 自动帧选择

- [x] 2.1 扩展 `LlmExtractor` 接口：新增 `selectFrames` 方法和 `FrameSelectionInput`/`FrameSelectionResult` 类型。
- [x] 2.2 `MockExtractor.selectFrames`：返回空帧指派。
- [x] 2.3 `VlmExtractor.selectFrames`：采样候选帧（max 8, 均匀）→ 构造 prompt → 调 VLM → 解析帧索引 → 映射回路径。
- [x] 2.4 `extract` 阶段集成：调用 `selectFrames`，结果写入 `draft.frames` 作为预填默认值。
- [x] 2.5 `FrameRoleConfig` 扩展 `required` 字段；`validateForApproval` 区分必填/选填。
- [x] 2.6 写测试：帧选择接口、VLM 索引映射、required 校验、MockExtractor 回退。

## 3. 验证

- [x] 3.1 `pnpm --filter @valotool/lineup-ingest test` 全部通过（63 tests）。
- [x] 3.2 `pnpm --filter @valotool/lineup-ingest typecheck` 通过。
