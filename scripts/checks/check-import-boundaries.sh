#!/usr/bin/env bash
# input: staged index/worktree source plus regex rules in quality/import-boundaries.txt
# output: blocks imports that cross declared architecture boundaries when STRICT=1
# pos: mechanical enforcement of PROJECT_MAP dependency direction
set -euo pipefail

mode="${1:---all}"
rules="${2:-quality/import-boundaries.txt}"
STRICT="${STRICT:-0}"

read_index_or_file() {
  local path="$1"
  if [ "$mode" = "staged" ]; then git show ":$path"; else cat "$path"; fi
}
if [ "$mode" = "staged" ]; then
  git cat-file -e ":$rules" 2>/dev/null \
    || { echo "[check-import-boundaries] ✗ staged rules missing" >&2; exit 2; }
else
  [ -f "$rules" ] || { echo "[check-import-boundaries] ✗ rules missing: $rules" >&2; exit 2; }
fi

rule_content="$(read_index_or_file "$rules")"
violations=0
while IFS= read -r line; do
  case "$line" in '' | \#*) continue ;; esac
  from_glob="$(printf '%s' "${line%%==>*}" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')"
  forbid="$(printf '%s' "${line##*==>}" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')"
  [ -n "$from_glob" ] && [ -n "$forbid" ] || continue
  matched_files="$(git ls-files "$from_glob")" \
    || { echo "[check-import-boundaries] ✗ git enumeration failed" >&2; exit 2; }
  while IFS= read -r file; do
    [ -n "$file" ] || continue
    if [ "$mode" = "staged" ]; then
      git cat-file -e ":$file" 2>/dev/null || continue
    elif [ ! -f "$file" ]; then
      echo "[check-import-boundaries] ✗ tracked file missing: $file" >&2
      exit 2
    fi
    hits="$(read_index_or_file "$file" | grep -nE "(import|require|from).*${forbid}" || true)"
    if [ -n "$hits" ]; then
      echo "[check-import-boundaries] ⚠ $file imports forbidden pattern '$forbid'"
      printf '%s\n' "$hits" | sed 's/^/    /'
      violations=$((violations + 1))
    fi
  done <<< "$matched_files"
done <<< "$rule_content"

if [ "$violations" -gt 0 ] && [ "$STRICT" = "1" ]; then
  echo "[check-import-boundaries] ✗ STRICT: $violations violation(s)" >&2
  exit 1
fi
echo "[check-import-boundaries] ✓ complete ($violations warning(s))"
