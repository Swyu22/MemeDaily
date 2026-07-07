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
# Per-platform tophub boards are included so the agent's ready pool isn't 微博/百度/聚合榜-only —
# 小红书/抖音 were chronically under-represented as sources. ONLY boards that genuinely SERVER-render
# their list are here (verified: the 抖音 realtime board /n/3adqqzadng returns real video titles +
# hashtags + play counts; 知乎 /n/mproPpoq6O returns the real 热榜). NOTE: several tophub node pages
# (抖音总榜, B站全站日榜) render their list CLIENT-SIDE — they'd yield only nav/scaffold, so they're
# excluded; the tophub HOMEPAGE already inlines a few B站/微博 top items. 小红书 has NO fetchable
# aggregator board (anti-scraping) — it stays sparse by nature; the prompt tells the agent to surface
# it via honest public-page/search evidence when a meme clearly lives there, never to fabricate.
SOURCES="
tophub|https://tophub.today/
douyin-hot|https://tophub.today/n/3adqqzadng
zhihu-hot|https://tophub.today/n/mproPpoq6O
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
