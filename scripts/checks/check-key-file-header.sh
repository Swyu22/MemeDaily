#!/usr/bin/env bash
# input: quality/key-files.txt（每行一个关键文件路径；空行/# 注释忽略）
# output: 关键文件缺头部说明块（input/output/pos）则告警
# pos: 落实 CONSTITUTION §4.3「关键文件强制头部说明」
set -euo pipefail

LIST="${1:-quality/key-files.txt}"
STRICT="${STRICT:-0}"

if [ ! -f "$LIST" ]; then
  echo "[check-key-file-header] – 跳过：未找到 $LIST（可选；新增关键文件时在此登记）"
  exit 0
fi

miss=0
while IFS= read -r path; do
  case "$path" in '' | \#*) continue ;; esac
  if [ ! -f "$path" ]; then
    echo "[check-key-file-header] ⚠ 清单登记的文件不存在: $path"
    continue
  fi
  head_block="$(head -n 20 "$path")"
  if printf '%s' "$head_block" | grep -q 'input:' \
    && printf '%s' "$head_block" | grep -q 'output:' \
    && printf '%s' "$head_block" | grep -q 'pos:'; then
    :
  else
    echo "[check-key-file-header] ⚠ $path 缺头部说明块（需含 input/output/pos，CONSTITUTION §4.3）"
    miss=$((miss + 1))
  fi
done < "$LIST"

if [ "$miss" -gt 0 ] && [ "$STRICT" = "1" ]; then
  echo "[check-key-file-header] ✗ STRICT：$miss 个关键文件缺头部" >&2
  exit 1
fi
echo "[check-key-file-header] ✓ 完成（$miss 个告警）"
