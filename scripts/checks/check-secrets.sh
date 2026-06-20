#!/usr/bin/env bash
# input: staged 文件（默认）或全仓 tracked 文件（--all）
# output: 命中疑似密钥/凭证模式则阻断（exit 1）；否则 exit 0
# pos: 公开仓库密钥泄露机械门禁（pre-commit 硬门禁 + CI 同源）
set -euo pipefail

mode="${1:-staged}"
self="scripts/checks/check-secrets.sh"

# High-signal, length-bounded credential patterns (avoid prose false positives):
#  Aliyun / AWS access-key ids, GitHub tokens, OpenAI/Anthropic keys, PEM headers.
PATTERNS='(LTAI[0-9A-Za-z]{20})|(AKIA[0-9A-Z]{16})|(gh[posu]_[0-9A-Za-z]{36})|(github_pat_[0-9A-Za-z_]{22,})|(sk-ant-[0-9A-Za-z_-]{20,})|(sk-proj-[0-9A-Za-z_-]{20,})|(sk-[A-Za-z0-9]{32,})|(-----BEGIN ([A-Z]+ )?PRIVATE KEY-----)'

list_files() {
  if [ "$mode" = "--all" ] || [ "$mode" = "all" ]; then
    git ls-files
  else
    git diff --cached --name-only --diff-filter=ACM
  fi
}

hits=0
while IFS= read -r f; do
  [ -n "$f" ] || continue
  [ -f "$f" ] || continue
  case "$f" in
    "$self") continue ;;                                  # don't scan our own pattern list
    *.woff2 | *.png | *.ico | *.jpg | *.jpeg | *.webp) continue ;;
    node_modules/* | .next/* | out/*) continue ;;
  esac
  # Print only path + line numbers, never the matched secret content.
  lines="$(grep -EnI "$PATTERNS" "$f" 2>/dev/null | cut -d: -f1 | tr '\n' ' ' || true)"
  if [ -n "$lines" ]; then
    echo "[check-secrets] ✗ 疑似密钥/凭证: $f（第 ${lines}行）"
    hits=$((hits + 1))
  fi
done < <(list_files)

if [ "$hits" -gt 0 ]; then
  echo "[check-secrets] ✗ 发现 $hits 个文件疑似含密钥。移除并在云控制台轮换后再提交。" >&2
  exit 1
fi
echo "[check-secrets] ✓ 未发现明显密钥模式"
