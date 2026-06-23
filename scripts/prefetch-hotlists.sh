#!/usr/bin/env bash
# input: (none) — a fixed list of public hot-list aggregators
# output: prefetch/*.txt — each aggregator's page fetched IN PARALLEL and stripped to plain text
# pos: speed step before the confined daily-publish agent, so it Reads a ready candidate pool
#      instead of fetching each aggregator sequentially over the network (slow). Same sources,
#      same breadth — only the network wait is parallelized. Never fails the job (best-effort).
set -uo pipefail # NOT -e: one dead source must not abort the whole prefetch

OUT="prefetch"
rm -rf "$OUT"
mkdir -p "$OUT"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

# name|url — public, server-rendered hot-list aggregators (aggregator-first; see automation prompt).
SOURCES="
tophub|https://tophub.today/
rebang|https://rebang.today/
cnxiaobai|https://hot.cnxiaobai.com/
moyuoo|https://moyuoo.com/
baidu-hot|https://top.baidu.com/board?tab=realtime
weibo-hot|https://s.weibo.com/top/summary
"

strip_to_text() {
  # tags out, entities decoded, whitespace collapsed, capped so the agent reads a compact digest.
  python3 -c "
import sys, re, html
t = sys.stdin.read()
t = re.sub(r'(?is)<(script|style|noscript)[^>]*>.*?</\1>', ' ', t)
t = re.sub(r'(?s)<[^>]+>', ' ', t)
t = html.unescape(t)
t = re.sub(r'[ \t\r\f\v]+', ' ', t)
t = re.sub(r'\n\s*\n+', '\n', t).strip()
sys.stdout.write(t[:24000])
" 2>/dev/null || true
}

fetch_one() {
  name="$1"; url="$2"
  body="$(curl -sL --compressed --max-time 25 -A "$UA" "$url" 2>/dev/null || true)"
  if [ -n "$body" ]; then
    printf '%s' "$body" | strip_to_text > "$OUT/${name}.txt"
  fi
  bytes="$(wc -c < "$OUT/${name}.txt" 2>/dev/null || echo 0)"
  echo "  ${name}: ${bytes} bytes"
}

# here-string (NOT a pipe) so the loop runs in the main shell and `wait` waits for the bg curls.
while IFS='|' read -r name url; do
  [ -n "${name:-}" ] || continue
  fetch_one "$name" "$url" &
done <<< "$SOURCES"
wait

echo "prefetch done -> $OUT/ ($(ls -1 "$OUT" 2>/dev/null | wc -l | tr -d ' ') files)"
