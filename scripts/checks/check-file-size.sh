#!/usr/bin/env bash
# input: staged 代码文件（默认）或全仓代码文件（--all）
# output: 超过 MAX_LINES 的文件告警；默认不阻断，STRICT=1 时阻断
# pos: 质量红线「单文件 ≤ 800 行」的机械校验（CONSTITUTION §6）
set -euo pipefail

MAX_LINES="${MAX_LINES:-800}"
STRICT="${STRICT:-0}"
mode="${1:-staged}"

list_files() {
  if [ "$mode" = "--all" ] || [ "$mode" = "all" ]; then
    git ls-files '*.ts' '*.tsx' '*.js' '*.jsx' '*.py' 2>/dev/null | grep -v '^docs/project/' || true
  else
    git diff --cached --name-only --diff-filter=ACM 2>/dev/null \
      | grep -E '\.(ts|tsx|js|jsx|py)$' \
      | grep -v '^docs/project/' || true
  fi
}

over=0
while IFS= read -r f; do
  [ -n "$f" ] || continue
  [ -f "$f" ] || continue
  lines=$(wc -l < "$f" | tr -d ' ')
  if [ "$lines" -gt "$MAX_LINES" ]; then
    echo "[check-file-size] ⚠ ${f} = ${lines} 行 > ${MAX_LINES}，建议拆分（CONSTITUTION §6）"
    over=$((over + 1))
  fi
done < <(list_files)

if [ "$over" -gt 0 ] && [ "$STRICT" = "1" ]; then
  echo "[check-file-size] ✗ STRICT 模式：${over} 个文件超限" >&2
  exit 1
fi
echo "[check-file-size] ✓ 完成（${over} 个告警）"
