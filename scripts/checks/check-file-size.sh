#!/usr/bin/env bash
# input: staged index bytes (default) or tracked first-party code/workflows (--all)
# output: blocks files above MAX_LINES when STRICT=1
# pos: mechanical enforcement of the 800-line first-party file limit
set -euo pipefail

MAX_LINES="${MAX_LINES:-800}"
STRICT="${STRICT:-0}"
mode="${1:-staged}"
pattern='^(src/.*\.(ts|tsx|js|jsx|css)|scripts/.*\.(ts|js|mjs|py|sh)|public/[^/]+\.(js|css)|\.github/workflows/.*\.ya?ml|[^/]+\.(ts|js|mjs|css))$'

if [ "$mode" = "--all" ] || [ "$mode" = "all" ]; then
  candidates="$(git -c core.quotePath=false ls-files)" \
    || { echo "[check-file-size] ✗ git enumeration failed" >&2; exit 2; }
else
  candidates="$(git -c core.quotePath=false diff --cached --name-only --diff-filter=ACMRT)" \
    || { echo "[check-file-size] ✗ staged enumeration failed" >&2; exit 2; }
fi
files="$(printf '%s\n' "$candidates" | grep -E "$pattern" | grep -v '^docs/project/' || true)"

line_count() {
  local file="$1"
  if [ "$mode" = "--all" ] || [ "$mode" = "all" ]; then
    awk 'END{print NR}' "$file"
  else
    git show ":$file" | awk 'END{print NR}'
  fi
}

over=0
while IFS= read -r file; do
  [ -n "$file" ] || continue
  if [ "$mode" != "--all" ] && [ "$mode" != "all" ]; then
    git cat-file -e ":$file" 2>/dev/null \
      || { echo "[check-file-size] ✗ cannot read staged blob: $file" >&2; exit 2; }
  elif [ ! -f "$file" ]; then
    echo "[check-file-size] ✗ tracked file missing from worktree: $file" >&2
    exit 2
  fi
  lines="$(line_count "$file")"
  if [ "$lines" -gt "$MAX_LINES" ]; then
    echo "[check-file-size] ⚠ $file = $lines lines > $MAX_LINES"
    over=$((over + 1))
  fi
done <<< "$files"

if [ "$over" -gt 0 ] && [ "$STRICT" = "1" ]; then
  echo "[check-file-size] ✗ STRICT: $over file(s) exceed the limit" >&2
  exit 1
fi
echo "[check-file-size] ✓ complete ($over warning(s))"
