#!/usr/bin/env bash
# input: quality/import-boundaries.txt（规则；每行 "from_glob ==> 禁止的 import 子串"）
# output: 命中跨层 import 则告警；STRICT=1 时阻断
# pos: 落实 PROJECT_MAP §依赖规则（默认关闭/opt-in，技术栈中立）
set -euo pipefail

RULES="${1:-quality/import-boundaries.txt}"
STRICT="${STRICT:-0}"

if [ ! -f "$RULES" ]; then
  echo "[check-import-boundaries] – 跳过：未找到 $RULES（opt-in；规则示例见 quality/import-boundaries.example.txt 与 PROJECT_MAP §依赖规则）"
  exit 0
fi

violations=0
while IFS= read -r line; do
  case "$line" in '' | \#*) continue ;; esac
  from_glob="$(printf '%s' "${line%%==>*}" | xargs)"
  forbid="$(printf '%s' "${line##*==>}" | xargs)"
  [ -n "$from_glob" ] && [ -n "$forbid" ] || continue
  while IFS= read -r f; do
    [ -f "$f" ] || continue
    hits="$(grep -nE "(import|require|from).*${forbid}" "$f" || true)"
    if [ -n "$hits" ]; then
      echo "[check-import-boundaries] ⚠ $f 违反规则（禁止 import 含 '$forbid'）："
      printf '%s\n' "$hits" | sed 's/^/    /'
      violations=$((violations + 1))
    fi
  done < <(git ls-files "$from_glob" 2>/dev/null || true)
done < "$RULES"

if [ "$violations" -gt 0 ] && [ "$STRICT" = "1" ]; then
  echo "[check-import-boundaries] ✗ STRICT：$violations 处越界" >&2
  exit 1
fi
echo "[check-import-boundaries] ✓ 完成（$violations 处告警）"
