#!/usr/bin/env bash
# input: 暂存区（cached，默认）或工作区（worktree）的 git 改动
# output: 建议 tier（micro|feature|milestone），仅提示不阻断
# pos: 为「分级仪式」提供 tier 建议（CONSTITUTION §分级回写）
set -euo pipefail

RANGE="${1:-cached}" # cached | worktree

if [ "$RANGE" = "worktree" ]; then
  stat="$(git diff --numstat 2>/dev/null || true)"
else
  stat="$(git diff --cached --numstat 2>/dev/null || true)"
fi

if [ -z "$stat" ]; then
  echo "[suggest-tier] 无改动可分析（range=$RANGE）"
  exit 0
fi

files=$(printf '%s\n' "$stat" | grep -c . || true)
lines=$(printf '%s\n' "$stat" | awk '{a+=$1; d+=$2} END{print a + d + 0}')
modules=$(printf '%s\n' "$stat" | awk '{print $3}' | grep -E '^src/' | awk -F/ '{print $2}' | sort -u | grep -c . || true)
arch_touch=$(printf '%s\n' "$stat" | awk '{print $3}' | grep -Ec 'PROJECT_MAP|docs/10-spec|\.d\.ts$|interface' || true)

tier="feature"
if [ "$files" -le 1 ] && [ "${lines:-0}" -le 10 ]; then
  tier="micro"
fi
if [ "$files" -ge 6 ] || [ "${modules:-0}" -ge 2 ] || [ "${lines:-0}" -ge 200 ] || [ "${arch_touch:-0}" -ge 1 ]; then
  tier="milestone"
fi

echo "[suggest-tier] 改动: ${files} 文件 / ${lines} 行 / ${modules} 模块 / 架构敏感命中 ${arch_touch}"
echo "[suggest-tier] 建议 tier = ${tier}（确认后写入 .cloud.md frontmatter.tier）"
