#!/usr/bin/env bash
# input: .cloud.md frontmatter
# output: 打印 goal / tier / active_session / next_actions（供 SessionStart 注入上下文）
# pos: 断点续作自动加载，落实「渐进式上下文加载」第一步
set -euo pipefail

STATE_FILE="${1:-.cloud.md}"
if [ ! -f "$STATE_FILE" ]; then
  echo "(未找到 .cloud.md：新项目请先运行 /start 初始化状态)"
  exit 0
fi

fm="$(awk 'NR==1 && $0!="---"{exit} /^---[[:space:]]*$/{c++; next} c==1{print} c>=2{exit}' "$STATE_FILE")"
if [ -z "$fm" ]; then
  echo "(.cloud.md 缺少 frontmatter，机器无法解析状态)"
  exit 0
fi

echo "=== 断点续作（来自 .cloud.md，机器可读状态） ==="
printf '%s\n' "$fm" | grep -E '^(goal|tier|active_session|updated):' || true
echo "--- next_actions ---"
printf '%s\n' "$fm" | awk '/^next_actions:/{f=1;next} /^[a-z_]+:/{f=0} f' || true
echo "=================================================="
echo "提示：先对齐以上目标与下一步，再进入执行（详见 AGENTS.md 工作流）。"
