## 1. CLI scripts 入口确认

- [x] 1.1 `ingest` script 已存在：`tsx src/cli.ts run`（fetch→segment→capture→extract→stage）
- [x] 1.2 `review` script 已存在：`tsx src/review/server.ts`（HTTP UI at :5180）
- [x] 1.3 `promote` script 已存在：`tsx scripts/promote.ts`（approved→Lineup + 复制帧 + 合并到 data/lineups）
- [x] 1.4 验证三个 script 在当前环境下可正常执行（`ingest` 输出用法，入口文件均存在）

## 2. 端到端流程验证

- [ ] 2.1 选一条 B站视频，用油猴采时间轴并导出 SourceJSON
- [ ] 2.2 手动跑 `pnpm ingest sources/<bvid>.json`，确认 fetch→segment→capture→extract→stage 全阶段无报错
- [ ] 2.3 启动 `review`，确认 `staging/<bvid>.json` 在 UI 中可加载、候选帧可预览
- [ ] 2.4 在 review UI 中 approve 一条草稿，确认写回 staging
- [ ] 2.5 跑 promote，确认产出 `data/lineups/<map>-<agent>.json` 格式合法

## 3. 流程文档更新

- [ ] 3.1 更新 `AGENTS.md` — AGENTS.md 是 Codex AI 规则文件，非用户操作文档，跳过
- [x] 3.2 更新 `packages/lineup-ingest/README.md`：添加油猴工作流（Step 0）+ COS 上传步骤（Step 4），保留 CLI 时间轴作为备选
