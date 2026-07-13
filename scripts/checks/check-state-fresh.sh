#!/usr/bin/env bash
# input: staged index state (pre-commit) or worktree state (CI/hooks)
# output: blocks invalid/stale state and unstaged SSOT updates
# pos: shared .cloud.md contract and recency gate
set -euo pipefail

mode="${1:-worktree}"
STATE_FILE="${2:-.cloud.md}"
case "$mode" in staged|--all|all|worktree) ;; *) STATE_FILE="$mode"; mode="worktree" ;; esac
fail() { echo "[check-state-fresh] ✗ $1" >&2; exit 1; }

if [ "$mode" = "staged" ]; then
  git cat-file -e ":$STATE_FILE" 2>/dev/null || fail "staged $STATE_FILE is missing"
  state="$(git show ":$STATE_FILE")"
else
  [ -f "$STATE_FILE" ] || fail "missing $STATE_FILE"
  state="$(cat "$STATE_FILE")"
fi

fm="$(printf '%s\n' "$state" | awk 'NR==1 && $0!="---"{exit} /^---[[:space:]]*$/{c++; next} c==1{print} c>=2{exit}')"
[ -n "$fm" ] || fail "$STATE_FILE has no YAML frontmatter"
get() { printf '%s\n' "$fm" | grep -E "^$1:" | sed -n '1{s/^'"$1"':[[:space:]]*//; s/^"//; s/"$//; p;}' ; }

goal="$(get goal)"
updated="$(get updated)"
tier="$(get tier)"
active_session="$(get active_session)"
is_placeholder() { case "$1" in ""|"\"\""|YYYY-MM-DD*|*待填*|*TODO*|*todo*) return 0 ;; *) return 1 ;; esac; }
is_placeholder "$goal" && fail "frontmatter.goal is empty or a placeholder"
is_placeholder "$updated" && fail "frontmatter.updated is empty or a placeholder"
case "$tier" in micro|feature|milestone) ;; *) fail "invalid frontmatter.tier: ${tier:-<empty>}" ;; esac
[[ "$updated" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2} ]] || fail "frontmatter.updated must start with YYYY-MM-DD"
[ -n "$active_session" ] || fail "frontmatter.active_session is empty"
if [ "$mode" = "staged" ]; then
  git cat-file -e ":$active_session" 2>/dev/null || fail "staged active_session is missing: $active_session"
else
  [ -f "$active_session" ] || fail "active_session is missing: $active_session"
fi

if git rev-parse --git-dir >/dev/null 2>&1; then
  staged="$(git -c core.quotePath=false diff --cached --name-only --diff-filter=ACMRTD)" \
    || fail "cannot enumerate staged files"
  relevant="$(printf '%s\n' "$staged" | grep -Ev '^(data/daily|data/daily-news)/[0-9]{4}-[0-9]{2}-[0-9]{2}\.json$' | sed '/^$/d' || true)"
  if [ -n "$relevant" ] && ! printf '%s\n' "$staged" | grep -qx '.cloud.md'; then
    fail "state-affecting changes require staged .cloud.md (generated daily JSON is exempt)"
  fi
  latest="$(git log -1 --format=%cs -- . ':(exclude)data/daily/**' ':(exclude)data/daily-news/**' 2>/dev/null || true)"
  updated_date="${updated:0:10}"
  if [ -n "$latest" ] && [[ "$updated_date" < "$latest" ]]; then
    fail "frontmatter.updated=$updated_date predates latest project change $latest"
  fi
fi
echo "[check-state-fresh] ✓ contract and recency pass (updated=$updated)"
