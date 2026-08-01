---
description: 生成中文 commit、推送到 dev 分支并创建 Pull Request
---

## 约定

- **分支**：feat 分支 → `dev`（单 PR 即可），最终由 maintainer 合并到 `main`
- **Commit 格式**：`type(scope): 中文描述`
  - `type`: feat / fix / refactor / docs / chore
  - `scope`: 包名或模块名，如 `lineup-ingest`, `lineup-content`, `review`, `pipeline`
  - 描述：用中文写，简短概括变更内容
  - 示例：`fix(lineup-ingest): startSec 支持小数秒`、`feat(review): 地图和特工改为下拉选项`
- **消息用中文**，不用英文
- **不要 commit secrets**（`.env.local` 等），`.env.example` 可以

## 步骤

### 1. 查看变更
```bash
git status && git diff --stat
```

### 2. 审查变更
列出修改的文件及其简要说明，确认没有算错文件或遗漏。

### 3. 生成 commit 并推送
```bash
git add <相关文件>
git commit -m "<type>(<scope>): <中文描述>"
git push origin HEAD
```

### 4. 创建 PR
```bash
gh pr create --base dev --title "<中文 PR 标题>" --body "<PR 描述>"
```
PR 标题与 commit 一致即可。描述用中文列出变更点。

### 5. 输出 PR 链接
