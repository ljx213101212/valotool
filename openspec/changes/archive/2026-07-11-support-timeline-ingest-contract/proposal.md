## Why

`timeline` 当前只把时间轴文本转为 `segments`，使用者仍需手工拼装 ingest 所需的采集源元数据。这使生成的 `jett.json` 出现了占位 bvid、URL、创作者和地图，无法通过来源校验，也不能直接投入 ingest 管线。

## What Changes

- 扩展时间轴解析命令，使其可生成一个完整的、可直接写入 `sources/*.json` 的 `SourceVideo[]` 清单，而非仅输出 `segments`。
- 接受并校验 bvid、标题、创作者、英雄与地图等 ingest 必需元数据；从 bvid 派生标准 Bilibili URL，避免手工拼接占位 URL。
- 保留仅解析时间轴为 `segments` 的既有调用方式，避免破坏已有手工录入流程。
- 为完整来源清单和元数据缺失/不一致场景补充测试与命令说明。

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `lineup-ingestion`: 时间轴录入从仅生成切片扩展为能生成 ingest 可校验的完整采集源清单。

## Impact

- 受影响代码：`packages/lineup-ingest/scripts/parse-timeline.ts`、时间轴解析模块及其测试、`packages/lineup-ingest/README.md`。
- 输出与 `sourceVideoSchema` 对齐，供 `check:sources` 和 `ingest` 直接使用；不新增运行时依赖。
