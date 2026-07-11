# Design

## 喂给 VLM 什么:接触表(一段一图)

extract 在**人审之前**跑,此时只有候选帧全集(每段几十张),没有人选定的三帧。把几十张全喂 VLM 又贵又噪。

**方案**:喂该段已有的**接触表**(6 列 1fps montage,一段一张)。一图含全段时序(站位→瞄准→落点)与 up 主标注,**一段一次调用**,成本可控、上下文完整。
**风险与退路**:montage 单格 240px,花哨标注字可能糊。先用接触表,**让 eval 说话**;若类别字段准确率不达标,再退化为「抽样 3~5 张全分辨率帧」喂入(`ExtractInput.images` 接口已通用,切换不动主流程)。

## 模型抽象:OpenAI 兼容多模态接口

`VlmExtractor` 走 **OpenAI 兼容的多模态 chat**(`messages` 含 image_url/base64)。国内 provider(通义-VL via DashScope、智谱 GLM-4V、阶跃等)多提供 OpenAI 兼容端点,故经 env 配置即可换:`VLM_BASE_URL` / `VLM_API_KEY` / `VLM_MODEL`。不绑死某家,密钥不入库。

## 硬/软分工不变

`side`/`site` 仍由 `parseQuery` 从标题确定性抽——VLM **不碰**,继续压幻觉、省 token。VLM 只填软字段:`abilitySlot`(看技能特效:紫色声呐=E 探测箭/电击=Q 电箭)、`technique`、`origin`、`target`、`purpose`、`timing`。输出 **schema 约束的 JSON**,键固定、`abilitySlot`/`technique` 限定枚举、地图/角色给闭词表;解析后逐字段校验,非法字段丢弃并记 warning,**不整条失败、不臆造**。

## 缓存与幂等

VLM 调用按「模型 + prompt + 图像内容」哈希缓存到 flat `.work/.vlm-cache/<hash>.json`,**仅缓存成功结果**;重跑命中不重复付费、断点续跑,prompt/模型一变即自然失效(比 per-bvid/segId 更稳:跨视频去重、对调 prompt 鲁棒)。`INGEST_EXTRACTOR=vlm` 时启用真模型,缺省 `mock` 保持现状、无 key 可开发。

## eval:有它才算工程

- **ground truth** = 人审 `approved` 草稿里人填的字段(`draftToLineupInput` 的软字段)。
- **指标**:
  - 类别字段 `abilitySlot`/`technique`:**精确命中率**(干净、可量化)。
  - 自由文本 `origin`/`target`/`purpose`:精确匹配过严 → v1 **并排导出**(人填 vs VLM)供人工判,报告"大致命中"由人标。LLM-as-judge 留作后续。
- `scripts/eval-extract.ts`:对有 ground truth 的段跑 VlmExtractor、对比、出报告(每字段命中率 + 自由文本对照表)。ground truth 随人审增多而变厚。
- 面试叙事锚点:**加 VLM 前后/调 prompt 前后,abilitySlot 命中率从 X→Y**。

## 可测性(TDD)

纯逻辑抽出来单测,HTTP 调用 mock:
- prompt 构造(含枚举/闭词表约束)。
- VLM 原始输出 → 字段解析+校验(合法保留、非法丢弃记 warning、JSON 坏掉降级)。
- eval 打分逻辑(类别命中率计算)。
`VlmExtractor` 的网络层注入一个 `fetch` 桩即可测,不打真接口。
