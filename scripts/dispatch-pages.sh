#!/usr/bin/env bash
# input: expected git SHA already pushed to main; optional workflow filename
# output: exits 0 only after a correlated push or recovery Pages run succeeds
# pos: trusted deployment correlation shared by publishers and fallback jobs
set -euo pipefail

expected_sha="${1:?usage: dispatch-pages.sh <expected-sha> [workflow]}"
workflow="${2:-pages.yml}"
api_attempts="${PAGES_API_ATTEMPTS:-4}"
push_poll_attempts="${PAGES_PUSH_POLL_ATTEMPTS:-6}"
poll_attempts="${PAGES_POLL_ATTEMPTS:-24}"
poll_delay="${PAGES_POLL_DELAY_SECONDS:-5}"
status_attempts="${PAGES_STATUS_ATTEMPTS:-48}"
status_delay="${PAGES_STATUS_DELAY_SECONDS:-15}"
retry_delay="${PAGES_RETRY_BASE_SECONDS:-3}"

retry() {
  local label="$1"
  shift
  local attempt=1 delay="$retry_delay"
  while [ "$attempt" -le "$api_attempts" ]; do
    if "$@"; then return 0; fi
    echo "::warning::${label} attempt ${attempt}/${api_attempts} failed." >&2
    if [ "$attempt" -lt "$api_attempts" ]; then sleep "$delay"; fi
    delay=$((delay * 2))
    attempt=$((attempt + 1))
  done
  echo "::error::${label} failed after ${api_attempts} attempts." >&2
  return 1
}

list_run_ids() {
  local event="$1"
  gh run list --workflow="$workflow" --event="$event" --limit=30 \
    --json databaseId --jq '.[].databaseId'
}

list_candidate_runs() {
  local event="$1"
  gh run list --workflow="$workflow" --event="$event" --limit=30 \
    --json databaseId,headSha --jq '.[] | "\(.databaseId) \(.headSha)"'
}

includes_expected() {
  local run_sha="$1"
  [ "$run_sha" = "$expected_sha" ] \
    || git merge-base --is-ancestor "$expected_sha" "$run_sha" 2>/dev/null
}

find_new_run() {
  local event="$1" before_ids="$2" runs run_id run_sha
  runs="$(retry "list candidate Pages runs" list_candidate_runs "$event")" || return 1
  while read -r run_id run_sha; do
    [ -n "$run_id" ] || continue
    if printf '%s\n' "$before_ids" | grep -qx "$run_id"; then continue; fi
    if includes_expected "$run_sha"; then printf '%s\n' "$run_id"; return 0; fi
  done <<< "$runs"
  return 1
}

find_push_run() {
  local runs run_id run_sha
  runs="$(retry "list push-triggered Pages runs" list_candidate_runs push)" || return 1
  while read -r run_id run_sha; do
    [ -n "$run_id" ] || continue
    if includes_expected "$run_sha"; then printf '%s\n' "$run_id"; return 0; fi
  done <<< "$runs"
  return 1
}

wait_for_success() {
  local run_id="$1" state status conclusion attempt
  for ((attempt = 1; attempt <= status_attempts; attempt++)); do
    state="$(retry "read Pages run ${run_id} status" gh run view "$run_id" \
      --json status,conclusion --jq '[.status, (.conclusion // "")] | @tsv')" || return 1
    IFS=$'\t' read -r status conclusion <<< "$state"
    if [ "$status" = "completed" ]; then
      [ "$conclusion" = "success" ] && return 0
      echo "::error::$workflow run $run_id ended ${conclusion:-without a conclusion}." >&2
      return 1
    fi
    if [ "$attempt" -lt "$status_attempts" ]; then sleep "$status_delay"; fi
  done
  echo "::error::Timed out waiting for $workflow run $run_id." >&2
  return 1
}

retry "fetch live main for Pages correlation" git fetch --quiet origin main

# A deploy-key push emits a normal `push` event, unlike GITHUB_TOKEN-authored pushes.
# Prefer that automatically queued run so each publication builds once. If it never
# appears or fails, retain workflow_dispatch as the bounded recovery path.
run_id=""
for ((attempt = 1; attempt <= push_poll_attempts; attempt++)); do
  if run_id="$(find_push_run)"; then break; fi
  if [ "$attempt" -lt "$push_poll_attempts" ]; then sleep "$poll_delay"; fi
done

if [ -n "$run_id" ]; then
  echo "Watching push-triggered $workflow run $run_id for $expected_sha."
  if wait_for_success "$run_id"; then
    echo "$workflow run $run_id successfully deployed $expected_sha (or a descendant)."
    exit 0
  fi
  echo "::warning::Push-triggered $workflow run $run_id failed; dispatching one recovery run." >&2
else
  echo "::warning::No push-triggered $workflow run appeared for $expected_sha; dispatching recovery." >&2
fi

before_ids="$(retry "list existing dispatched Pages runs" list_run_ids workflow_dispatch)"
retry "dispatch $workflow recovery" gh workflow run "$workflow" --ref main
run_id=""
for ((attempt = 1; attempt <= poll_attempts; attempt++)); do
  if retry "fetch live main for Pages correlation" git fetch --quiet origin main; then
    if run_id="$(find_new_run workflow_dispatch "$before_ids")"; then break; fi
  fi
  if [ "$attempt" -lt "$poll_attempts" ]; then sleep "$poll_delay"; fi
done

if [ -z "$run_id" ]; then
  echo "::error::No new $workflow run including $expected_sha appeared." >&2
  exit 1
fi
echo "Watching recovery $workflow run $run_id for $expected_sha."
wait_for_success "$run_id"
echo "$workflow run $run_id successfully deployed $expected_sha (or a descendant)."
