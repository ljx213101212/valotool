## Why

录入管线的 extract 阶段目前用 `MockExtractor` 产出**空软字段**——`purpose`/`origin`/`target`/`technique`/`abilitySlot` 全靠人审逐条手填,慢且是产品「往 AI 靠」叙事的空洞处。

产品差异化的内核就是这块 AI 抽取。让**多模态 VLM 直接读候选帧**(同时看画面、up 主标注文字、准星)自动填软字段,把人从「填字段」降到「核对/微调」。**配套 eval**(用人审过的真数据当 ground truth 量化抽取准确率)是关键——有 eval 才是工程,没 eval 只是 demo。

## What Changes

- **抽取走多模态**:extractor 输入扩展为可携带图像;extract 阶段把该段**接触表**(整段 1fps 概览图)喂给模型,一段一图、成本可控、带全段上下文。
- 新增 **`VlmExtractor`**(实现既有 `LlmExtractor` 接口):走 OpenAI 兼容的多模态 chat 接口、provider 无关(通义-VL/GLM-4V/… 经 env 配置 base_url/key/model)、schema 约束 JSON 输出、失败/低置信降级为 warning 不臆造。`MockExtractor` 保留供无 key 开发与测试。
- 管线按 env 选 extractor(`INGEST_EXTRACTOR=vlm|mock`),默认 mock 不破坏现状。
- 新增 **eval 骨架** `scripts/eval-extract.ts`:ground truth = 人审 approved 草稿的字段;对类别字段(`abilitySlot`/`technique`)算精确命中率,自由文本(origin/target/purpose)并排导出供人工核;报告指标。
- 非目标(Non-goals):OCR(VLM 直读帧,不再单独 OCR)、模型微调、RAG 检索侧(消费端,另一条线)、实时抽取。

## Capabilities

### Modified Capabilities

- `lineup-ingestion`:extract 阶段的「hybrid 结构化抽取」从「软字段交占位 extractor」细化为「软字段由**多模态 VLM 读帧**抽取,并有 eval 量化准确率」。硬字段(side/site)仍由 `parseQuery` 确定性来,不变。

## Impact

- `packages/lineup-ingest`:新增 `src/extractors/vlm.ts`、`scripts/eval-extract.ts`;改 `ExtractInput`(加 images)、`extract` 阶段(传接触表)、`prompts/extract-lineup`(多模态+schema 约束)、cli/pipeline(按 env 选 extractor)。
- 运行期依赖一个多模态 LLM API,经 env 配置(`VLM_BASE_URL`/`VLM_API_KEY`/`VLM_MODEL`),**密钥不入库**。
- 成本:按图调用(每段一张接触表);eval 调用量受 ground truth 条数约束。
- 不改 app/小程序;不改既有 Lineup schema 与 promote。
