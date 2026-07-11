## Context

`parse-timeline.ts` 当前读取纯时间轴文本并输出 `ManualSegment[]`。该输出需要再由人工补进 `SourceVideo` 的 id、URL、标题、作者、提示字段和致谢，因而不能直接作为 ingest 的输入。`jett.json` 的占位元数据说明这一步缺少可执行的录入契约。

## Goals / Non-Goals

**Goals:**

- 在同一命令中支持生成通过 `sourceFileSchema` 校验的 `SourceVideo[]` JSON。
- 以合法 BVID 派生 Bilibili 标准 URL 与致谢中的视频标识，杜绝 URL 手工拼接。
- 使地图、英雄等 ingest 的硬字段在生成时明确提供。
- 保留旧的纯 `segments` 输出。

**Non-Goals:**

- 不抓取 Bilibili 页面或自动推断视频标题、作者、地图、英雄。
- 不在时间轴阶段从点位标题推断 `side`/`site`；该职责仍属于 extract 阶段的 `parseQuery`。
- 不修改已存在的 source 文件或下载视频。

## Decisions

### 显式的完整来源模式

命令增加完整来源模式及元数据选项：BVID、标题、创作者、地图和英雄为必填，创作者 UID、录制版本与备注为可选。完整模式输出单元素 `SourceVideo[]`，可直接保存为 `sources/*.json` 并交给 `check:sources` 与 `ingest`。

选择显式参数而不是从自然语言标题或 Bilibili 网页提取：前者可重复、可离线运行，并在录入时暴露不确定信息；后者会受页面结构、登录、限流和错误匹配影响。

### 从 BVID 派生固定字段

完整模式把 `platform` 固定为 `bilibili`、`id` 设为 BVID、`url` 生成 `https://www.bilibili.com/video/<bvid>`，并从创作者/BVID/可选 UID 生成 `credit`。这让关键溯源字段共享一个真值来源，不留下占位字符串。

### 输出前复用既有 schema 校验

完整模式在写 stdout 前使用 `sourceFileSchema` 校验生成结果，并以清晰错误拒绝缺失或无效选项。时间轴的解析和顺序诊断保持既有行为；纯 segments 模式不要求元数据。

## Risks / Trade-offs

- [完整模式需要更多输入] → 所有必填参数在帮助信息中列出，并在缺失时说明字段名。
- [无法自动取得真实创作者资料] → 明确将该信息留给录入者，避免生成貌似真实但错误的 provenance。
- [旧脚本依赖纯数组输出] → 仅在显式完整模式改变 stdout 形状，默认行为不变。
