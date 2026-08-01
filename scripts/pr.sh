#!/usr/bin/env bash
set -euo pipefail

BRANCH=$(git branch --show-current)

if [[ ! "$BRANCH" =~ ^feat/ ]]; then
  echo "错误: 当前分支 '$BRANCH' 不是 feat/* 分支"
  exit 1
fi

TITLE="${1:-}"
if [[ -z "$TITLE" ]]; then
  TITLE=$(git log -1 --pretty=%s)
fi

BODY="${2:-$(git log -1 --pretty=%b)}"
if [[ -z "$BODY" ]]; then
  BODY="Auto PR from $BRANCH"
fi

echo "分支: $BRANCH"
echo "标题: $TITLE"
echo ""
echo "创建 PR: $BRANCH → dev (normal)"
gh pr create --base dev --head "$BRANCH" --title "$TITLE" --body "$BODY"

echo ""
echo "创建 PR: $BRANCH → main (draft)"
gh pr create --base main --head "$BRANCH" --title "$TITLE" --body "$BODY" --draft

echo ""
echo "完成"
