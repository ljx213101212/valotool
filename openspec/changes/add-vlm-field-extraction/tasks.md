## 1. 多模态输入打通

- [x] 1.1 `ExtractInput` 加 `images`（+ `title` 强信号）；`extract` 阶段传该段接触表。
- [x] 1.2 `prompts/extract-lineup` 改多模态 + schema 约束（JSON 键、abilitySlot/technique 限枚举、map/agent/标题上下文）。

## 2. VlmExtractor

- [x] 2.1 OpenAI 兼容多模态客户端（env `VLM_BASE_URL`/`VLM_API_KEY`/`VLM_MODEL`，默认 deepseek），图像 base64，注入式 `fetch`/`readImage` 便于测试。
- [x] 2.2 输出解析 + 逐字段校验 `vlm-parse`（合法保留 / 非法丢弃记 warning / 坏 JSON 降级）。
- [x] 2.3 调用缓存：按「模型+prompt+图像内容」哈希存 flat `.work/.vlm-cache/`，仅缓存成功结果；命中不重复付费、断点续跑（比 per-segId 更稳，prompt/模型变即失效）。
- [x] 2.4 cli/eval 共享 `extractorFromEnv`（INGEST_EXTRACTOR=vlm|mock，缺 key 回退 mock）。

## 3. eval 骨架

- [x] 3.1 从 staging `approved` 草稿取 ground truth。
- [x] 3.2 `scripts/eval-extract.ts` + 纯打分 `eval/score`：跑 extractor、类别命中率、自由文本并排、出报告。

## 4. 测试（先写）

- [x] 4.1 prompt 构造单测（枚举/上下文）。
- [x] 4.2 输出解析 + 校验单测（合法/非法/坏 JSON）。
- [x] 4.3 eval 打分单测（类别命中率聚合）。
- [x] 4.4 `VlmExtractor` fetch 桩集成测（请求结构/HTTP错/网络异常降级）。

## 5. 接真模型 & 验证（需 key）

- [x] 5.1 接真模型出首个 eval 报告。**坑：DeepSeek API（api.deepseek.com）实测只收 text、不收 image_url（"V4 多模态"是营销稿），改用智谱 glm-4.6v-flash（免费、OpenAI 兼容、确实能读图）**。首报告（ascent-0，1 条）：abilitySlot ✓(E)、purpose 准、technique ✗(placed vs stand)、origin 略偏。加了 429/503 退避重试（免费档常限流）。
- [ ] 5.2 据 eval 调 prompt / 决定是否退化到「抽样全分辨率帧」（待 ground truth 攒厚再调）。

## 6. 规格同步

- [x] 6.1 本 change 的 `specs/lineup-ingestion` 增量（MODIFIED hybrid + ADDED 多模态/eval）。
- [ ] 6.2 archive 时同步进 `openspec/specs/`。
