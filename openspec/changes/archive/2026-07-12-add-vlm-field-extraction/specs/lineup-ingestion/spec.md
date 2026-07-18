## MODIFIED Requirements

### Requirement: hybrid 结构化抽取，硬字段确定性来

系统 SHALL 复用现有 `parseQuery` 从段标题确定性抽取 `side`/`site`；软字段（`abilitySlot`/`technique`/`origin`/`target`/`purpose`/`timing`）SHALL 由可替换的 extractor 抽取，其默认实现为读取该段画面的**多模态 VLM**。无法确定的字段 SHALL 记入 warning 而非编造；VLM 输出 SHALL 经 schema 校验，非法字段丢弃并告警，不使整段失败。

#### Scenario: 标题确定性解析攻防与站点

- **WHEN** 段标题为「进攻a点内第一支」
- **THEN** 草稿 `fields.side` SHALL 为 `attack`、`fields.site` SHALL 为 `A`

#### Scenario: 无攻防字样时如实告警

- **WHEN** 段标题不含进攻/防守字样（如「a二楼上看二楼下」）
- **THEN** 系统 SHALL 在草稿 warning 标注「未能从标题确定 side」，不臆造 side

#### Scenario: VLM 输出经 schema 校验

- **WHEN** VLM 返回的 `abilitySlot`/`technique` 不在枚举内，或 JSON 解析失败
- **THEN** 系统 SHALL 丢弃非法字段（坏 JSON 则整体降级为空软字段）、记 warning，并保留已确定的硬字段，不中断该段

## ADDED Requirements

### Requirement: 软字段由多模态 VLM 读帧抽取

系统 SHALL 支持把段的画面（默认该段接触表图）输入多模态 VLM 抽取软字段；模型经 env 配置（base url / key / model）、provider 无关；调用结果 SHALL 可缓存以便幂等重跑不重复付费；无配置时 SHALL 回退到占位 extractor，不阻断管线。

#### Scenario: 缺模型配置时降级

- **WHEN** 未配置 VLM（无 key）
- **THEN** 管线 SHALL 用占位 extractor 继续产出草稿（软字段留空交人审），不报错

#### Scenario: 重跑命中缓存

- **WHEN** 对同一段以相同画面再次抽取且缓存已存在
- **THEN** 系统 SHALL 复用缓存结果，不重复调用 VLM

### Requirement: 抽取质量有 eval 量化

系统 SHALL 提供 eval：以人审 `approved` 草稿的软字段为 ground truth，对类别字段（`abilitySlot`/`technique`）计算精确命中率，对自由文本字段并排导出供人工判定，并输出报告。

#### Scenario: 类别字段命中率

- **WHEN** 存在 N 条人审 ground truth
- **THEN** eval SHALL 对每条跑 extractor，按 `abilitySlot`/`technique` 是否等于 ground truth 统计命中率并报告

#### Scenario: ground truth 为空

- **WHEN** 尚无人审 approved 草稿
- **THEN** eval SHALL 提示无 ground truth 并退出，不报错
