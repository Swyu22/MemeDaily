#!/usr/bin/env bash
# input: staged index bytes (default) or tracked worktree files (--all)
# output: blocks high-signal credential patterns without printing secret contents
# pos: public-repository secret gate shared by pre-commit and CI
set -euo pipefail

mode="${1:-staged}"
self="scripts/checks/check-secrets.sh"
patterns='(LTAI[0-9A-Za-z]{20})|(AKIA[0-9A-Z]{16})|(gh[posu]_[0-9A-Za-z]{36})|(github_pat_[0-9A-Za-z_]{22,})|(sk-ant-[0-9A-Za-z_-]{20,})|(sk-proj-[0-9A-Za-z_-]{20,})|(sk-[A-Za-z0-9]{32,})|(AIza[0-9A-Za-z_-]{35})|(xox[baprs]-[0-9A-Za-z-]{10,72})|(-----BEGIN ([A-Z]+ )?PRIVATE KEY-----)'

if [ "$mode" = "--all" ] || [ "$mode" = "all" ]; then
  files="$(git -c core.quotePath=false ls-files)" \
    || { echo "[check-secrets] ✗ git file enumeration failed" >&2; exit 2; }
else
  files="$(git -c core.quotePath=false diff --cached --name-only --diff-filter=ACMRT)" \
    || { echo "[check-secrets] ✗ staged file enumeration failed" >&2; exit 2; }
fi

scan_lines() {
  local file="$1"
  if [ "$mode" = "--all" ] || [ "$mode" = "all" ]; then
    grep -Ena "$patterns" "$file" 2>/dev/null | cut -d: -f1 | tr '\n' ' ' || true
  else
    git show ":$file" | grep -Ena "$patterns" | cut -d: -f1 | tr '\n' ' ' || true
  fi
}

hits=0
while IFS= read -r file; do
  [ -n "$file" ] || continue
  case "$file" in
    "$self" | *.woff2 | *.png | *.ico | *.jpg | *.jpeg | *.webp) continue ;;
    node_modules/* | .next/* | out/*) continue ;;
  esac
  if [ "$mode" != "--all" ] && [ "$mode" != "all" ]; then
    git cat-file -e ":$file" 2>/dev/null \
      || { echo "[check-secrets] ✗ cannot read staged blob: $file" >&2; exit 2; }
  elif [ ! -f "$file" ]; then
    echo "[check-secrets] ✗ tracked file missing from worktree: $file" >&2
    exit 2
  fi
  lines="$(scan_lines "$file")"
  if [ -n "$lines" ]; then
    echo "[check-secrets] ✗ suspected credential: $file (lines $lines)"
    hits=$((hits + 1))
  fi
done <<< "$files"

if [ "$hits" -gt 0 ]; then
  echo "[check-secrets] ✗ $hits file(s) may contain credentials; remove and rotate them" >&2
  exit 1
fi
echo "[check-secrets] ✓ no high-signal credential pattern found"
