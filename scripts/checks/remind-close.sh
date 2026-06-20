#!/usr/bin/env bash
# input: git 工作区/暂存区改动状态
# output: 若有代码/文档改动但 .cloud.md 未同步，提示运行 /close（非阻断，exit 0）
# pos: Claude Stop hook 钩子，防「改了东西不回写状态（SSOT 过期）」
set -euo pipefail

changed="$(git status --porcelain 2>/dev/null || true)"
[ -n "$changed" ] || exit 0 # 非 git 仓库或无改动：静默

code_changed="$(printf '%s\n' "$changed" | grep -E '\.(ts|tsx|js|jsx|py|md|json|css|scss|html)$' | grep -v '\.cloud\.md' || true)"
[ -n "$code_changed" ] || exit 0

state_changed="$(printf '%s\n' "$changed" | grep '\.cloud\.md' || true)"
if [ -z "$state_changed" ]; then
  echo "[remind] 检测到改动但 .cloud.md 未更新 → 收工请运行 /close 回写状态（文件系统是 SSOT）。"
fi
exit 0
