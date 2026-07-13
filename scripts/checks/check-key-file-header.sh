#!/usr/bin/env bash
# input: staged index bytes or tracked worktree plus quality/key-files.txt
# output: blocks missing files or key headers without input/output/pos when STRICT=1
# pos: mechanical enforcement of the critical-file orientation contract
set -euo pipefail

mode="${1:---all}"
list="${2:-quality/key-files.txt}"
STRICT="${STRICT:-0}"

read_index_or_file() {
  local path="$1"
  if [ "$mode" = "staged" ]; then git show ":$path"; else cat "$path"; fi
}

if [ "$mode" = "staged" ]; then
  git cat-file -e ":$list" 2>/dev/null \
    || { echo "[check-key-file-header] ✗ staged list missing: $list" >&2; exit 2; }
elif [ ! -f "$list" ]; then
  echo "[check-key-file-header] ✗ list missing: $list" >&2
  exit 2
fi

list_content="$(read_index_or_file "$list")"
miss=0
while IFS= read -r path; do
  case "$path" in '' | \#*) continue ;; esac
  if [ "$mode" = "staged" ]; then
    if ! git cat-file -e ":$path" 2>/dev/null; then
      echo "[check-key-file-header] ⚠ registered staged file missing: $path"
      miss=$((miss + 1))
      continue
    fi
  elif [ ! -f "$path" ]; then
    echo "[check-key-file-header] ⚠ registered file missing: $path"
    miss=$((miss + 1))
    continue
  fi
  head_block="$(read_index_or_file "$path" | sed -n '1,20p')"
  if ! { printf '%s' "$head_block" | grep -q 'input:' \
    && printf '%s' "$head_block" | grep -q 'output:' \
    && printf '%s' "$head_block" | grep -q 'pos:'; }; then
    echo "[check-key-file-header] ⚠ $path lacks input/output/pos in its first 20 lines"
    miss=$((miss + 1))
  fi
done <<< "$list_content"

if [ "$miss" -gt 0 ] && [ "$STRICT" = "1" ]; then
  echo "[check-key-file-header] ✗ STRICT: $miss key-file problem(s)" >&2
  exit 1
fi
echo "[check-key-file-header] ✓ complete ($miss warning(s))"
