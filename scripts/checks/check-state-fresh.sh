#!/usr/bin/env bash
# input: 项目根的 .cloud.md（含 YAML frontmatter）
# output: 状态新鲜返回 0；缺失/占位符返回 1
# pos: 被 git pre-commit / CI / Claude Stop hook 共用的「状态新鲜度」校验
set -euo pipefail

STATE_FILE="${1:-.cloud.md}"

fail() { echo "[check-state-fresh] ✗ $1" >&2; exit 1; }

[ -f "$STATE_FILE" ] || fail "缺少 $STATE_FILE（当前状态快照 / SSOT）"

# 提取首个 frontmatter 块（第 1 个 --- 到第 2 个 --- 之间）
fm="$(awk 'NR==1 && $0!="---"{exit} /^---[[:space:]]*$/{c++; next} c==1{print} c>=2{exit}' "$STATE_FILE")"
[ -n "$fm" ] || fail "$STATE_FILE 缺少 YAML frontmatter（机器可读状态，见 docs/00-context/STATE_SCHEMA.md）"

get() { printf '%s\n' "$fm" | grep -E "^$1:" | head -n1 | sed -E "s/^$1:[[:space:]]*//; s/^\"//; s/\"$//"; }

goal="$(get goal)"
updated="$(get updated)"

is_placeholder() {
  case "$1" in
    ""|"\"\""|YYYY-MM-DD*|*待填*|*TODO*|*todo*) return 0 ;;
    *) return 1 ;;
  esac
}

is_placeholder "$goal" && fail "frontmatter.goal 为空或占位符，请填写当前目标"
is_placeholder "$updated" && fail "frontmatter.updated 为空或占位符，请运行 /close 回写时间戳"

echo "[check-state-fresh] ✓ goal/updated 已填写（updated=${updated}）"
