# Spec-Driven 工作流（OpenSpec + Superpowers）

本仓库强制：**OpenSpec 管规划，Superpowers 管纪律**。动应用代码前必读本规则与 `AGENTS.md`。
不要从记忆直接实现——存在 OpenSpec change 时，先重读其上下文与 tasks。

## 边界

- **OpenSpec** = 定义「改什么、为什么」：产品意图、行为变更、能力语义、实现范围、任务边界的唯一真相。
- **Superpowers** = 定义「怎么安全地改」的工程纪律。
- 二者不互相替代；Superpowers 的设计文档不得取代 OpenSpec 的规划 artifact。

## OpenSpec 规则

- **模糊想法/早期调研** → 只探索（`openspec-explore` 思路），**不写应用代码**。
- **新功能 / 行为变更 / 有意义的重构** → 实现前先 `openspec` 立或更新一个 change（proposal + design + tasks + `specs/<capability>/spec.md` 增量）。
- **开始实现** → 从一个 active change 起，动代码前先读该 change 的上下文文件。
- **实现中发现 plan 不全/错/含糊** → 暂停实现，先改 OpenSpec artifact 再继续。
- **实现完成并验证** → `openspec archive <change>` 归档，并评估是否需要把 delta 同步进 `openspec/specs/`。
- 改完代码若影响逻辑/行为/配置/能力语义，**同一轮**审 `specs/` 并更新相关 spec；若无需更新，在收尾回复里**明确说明**。

## Superpowers 规则

- 实现前，按工作类型选对应纪律，而非临时拍流程。
- **功能 / bug 修复 / 重构 / 行为变更** → 走 `superpowers:test-driven-development`（先写测试），除非用户明确批准例外。
- **bug / 测试失败 / 构建失败 / 异常行为** → 先走 `superpowers:systematic-debugging` 再提/改 fix。
- **声称完成/修好/通过之前** → 走 `superpowers:verification-before-completion`，给出新鲜证据（实跑输出）。
- **大功能 / 高风险 / 接近合并** → 走 `superpowers:requesting-code-review`。

## OpenSpec CLI 速查（本机 v1.3.x）

- `openspec list` —— 列 active changes；`openspec list --specs` 列 specs。
- `openspec new change <name>` —— 在 `openspec/changes/<name>/` scaffold `.openspec.yaml`。
- `openspec validate <change>` —— 校验 change 格式（提交前必过）。
- `openspec archive <change>` —— 完成后归档并把 delta 同步进 `openspec/specs/`。
- `openspec show <item>` / `openspec instructions <artifact>` —— 查看/取创建指引。

### change 目录格式

```
openspec/changes/<name>/
  .openspec.yaml            # schema: spec-driven  +  created: YYYY-MM-DD
  proposal.md               # ## Why / ## What Changes / ## Capabilities / ## Impact
  design.md                 # 架构决策、取舍、被否决的方案
  tasks.md                  # 分节编号 + [x]/[ ] 复选框（如实标 done/pending）
  specs/<capability>/spec.md # 增量规格
```

### 增量 spec 格式

```
## ADDED Requirements      （或 MODIFIED / REMOVED）

### Requirement: <名称>
系统 SHALL <可验证的行为>。

#### Scenario: <名称>
- **WHEN** <条件>
- **THEN** 系统 SHALL <结果>
```

## 反例（务必避免）

新增整个 `packages/lineup-ingest` 录入管线时，曾**全程绕过**：没先立 change、零单元测试、bug 临时拍。
正确做法应是：先 `openspec new change` 写 proposal/tasks → 先写测试 → 再实现 → 验证给证据 → archive 同步 spec。
