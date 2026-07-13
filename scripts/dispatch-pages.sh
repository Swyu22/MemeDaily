#!/usr/bin/env bash
# input: expected git SHA already pushed to main; optional workflow filename
# output: exits 0 only after a newly dispatched Pages run including that SHA succeeds
# pos: trusted deployment correlation shared by publishers and fallback jobs
set -euo pipefail

expected_sha="${1:?usage: dispatch-pages.sh <expected-sha> [workflow]}"
workflow="${2:-pages.yml}"
before_ids="$(gh run list --workflow="$workflow" --event=workflow_dispatch --limit=30 \
  --json databaseId --jq '.[].databaseId')"

includes_expected() {
  local run_sha="$1"
  [ "$run_sha" = "$expected_sha" ] \
    || git merge-base --is-ancestor "$expected_sha" "$run_sha" 2>/dev/null
}

find_new_run() {
  local run_id run_sha
  while read -r run_id run_sha; do
    [ -n "$run_id" ] || continue
    if printf '%s\n' "$before_ids" | grep -qx "$run_id"; then continue; fi
    if includes_expected "$run_sha"; then printf '%s\n' "$run_id"; return 0; fi
  done < <(gh run list --workflow="$workflow" --event=workflow_dispatch --limit=20 \
    --json databaseId,headSha --jq '.[] | "\(.databaseId) \(.headSha)"')
  return 1
}

gh workflow run "$workflow" --ref main
run_id=""
for _attempt in 1 2 3 4 5 6 7 8 9 10 11 12; do
  sleep 5
  git fetch origin -q
  run_id="$(find_new_run || true)"
  [ -z "$run_id" ] || break
done

if [ -z "$run_id" ]; then
  echo "::error::No new $workflow run including $expected_sha appeared." >&2
  exit 1
fi
echo "Watching newly dispatched $workflow run $run_id for $expected_sha."
gh run watch "$run_id" --exit-status
conclusion="$(gh run view "$run_id" --json conclusion --jq '.conclusion')"
[ "$conclusion" = "success" ] \
  || { echo "::error::$workflow run $run_id ended $conclusion" >&2; exit 1; }
