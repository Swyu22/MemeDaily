#!/usr/bin/env bash
# input: PUBLISH_DEPLOY_KEY secret and GitHub owner/repository name
# output: pushes the already-validated local HEAD to protected refs/heads/main
# pos: sole ruleset-bypass transport, invoked only by trusted final workflow steps
set -euo pipefail

repository="${PUBLISH_REPOSITORY:-${GITHUB_REPOSITORY:-}}"
if [[ ! "$repository" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
  echo "::error::PUBLISH_REPOSITORY/GITHUB_REPOSITORY must be owner/name." >&2
  exit 1
fi
if [ -z "${PUBLISH_DEPLOY_KEY:-}" ]; then
  echo "::error::PUBLISH_DEPLOY_KEY is not configured." >&2
  exit 1
fi

key_file="$(mktemp)"
known_hosts_file="$(mktemp)"
cleanup() {
  rm -f "$key_file" "$known_hosts_file"
}
trap cleanup EXIT

chmod 600 "$key_file"
printf '%s\n' "$PUBLISH_DEPLOY_KEY" > "$key_file"

known_hosts_ready=false
for attempt in 1 2 3 4; do
  : > "$known_hosts_file"
  if gh api meta --jq '.ssh_keys[] | "github.com \(.)"' > "$known_hosts_file" \
    && [ -s "$known_hosts_file" ]; then
    known_hosts_ready=true
    break
  fi
  echo "::warning::GitHub SSH host-key lookup attempt ${attempt}/4 failed." >&2
  if [ "$attempt" -lt 4 ]; then sleep $((attempt * 2)); fi
done
if [ "$known_hosts_ready" != true ]; then
  echo "::error::GitHub API returned no SSH host keys after 4 attempts." >&2
  exit 1
fi

GIT_SSH_COMMAND="ssh -i ${key_file} -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=${known_hosts_file}" \
  git push "git@github.com:${repository}.git" HEAD:main
