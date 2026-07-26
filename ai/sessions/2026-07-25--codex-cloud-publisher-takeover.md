# AI Session Log - 2026-07-25 -- codex-cloud-publisher-takeover

## Session Meta

- Project: MemeDaily
- Device: local Mac workspace + ChatGPT Work Cloud
- Model: Codex
- Task Type: architecture / reliability / operations takeover
- Tier: milestone
- Start Time: 2026-07-25

## Start Snapshot

- Current goal: reconcile local/GitHub/production, repair the audited project, and
  replace the stopped Anthropic daily publishers with Codex Cloud.
- Scope: both feeds, all primary/catch-up/monitor/fallback triggers, trusted
  publication, CI/Pages, data boundaries, prompts, state, and production acceptance.
- Constraints: public web only; no direct model-to-main publication; one JSON per
  feed/date; Asia/Shanghai dates; keep the Mac out of the availability path.
- Acceptance: local/remote/Pages/production align, full gates pass, eight Cloud
  schedules are active, and one real candidate path is observed end to end.

## Work Completed

- Fast-forwarded local `main` from `6cf1195` to `47e16e1`; proved that local,
  GitHub `main`, the latest successful Pages deployment, and production shared that
  baseline before edits.
- Upgraded Next.js and production transitive overrides; production high-severity
  audit is zero. Added Node 22/npm 10 contracts and CI/Pages production audit gates.
- Downscoped Pages permissions so only deploy has `pages:write`/`id-token:write`.
- Hardened Pages dispatch into a bounded, SHA-correlated success wait; synchronized
  fallback to live main; serialized all automatic main writers; made monitors read
  live main and verify deployment freshness.
- Made empty DailyNews data fail validation and made fallback dates/paths reject
  traversal or invalid calendar dates.
- Added a public meme projection so client payloads exclude internal
  `brand_usage`, `risk`, and `published`; restored detail canonical/OG/Twitter metadata.
- Removed the stopped Anthropic publishers and GitHub/external cron ownership.
- Added `codex-daily-pr-publish.yml`: exact same-repository branch, one-file JSON
  extraction, read-only validation, trusted revalidation/rebase/push, and Pages wait.
- Added ADR-007 plus durable Cloud runbook and updated both living editorial prompts.
- Created and read back eight dedicated ChatGPT Work Cloud contexts. Each passed a
  non-local, read-only GitHub/main check and owns one active trigger group:
  `dailynews-06-00`, `dailynews-07-15-12-15`, `dailynews-14-45`,
  `dailynews-21-30`, `memedaily-07-00`, `memedaily-08-00-13-00`,
  `memedaily-14-30`, and `memedaily-21-20`.
- Added deploy-key-only main transport and a rollout ruleset
  `codex-trusted-main` (ID `19734348`). The repository has one writable key,
  `MemeDaily trusted publisher` (ID `158323935`), backed by the Actions secret
  `CODEX_PUBLISH_DEPLOY_KEY`.
- Final security review added a non-draft PR gate, push-triggered Pages-run adoption
  with dispatch recovery, and bounded GitHub SSH host-key lookup retries.
- PR #37 merged the takeover at `fbccae3`; main CI run `30162583775` and Pages run
  `30162583849` succeeded. Ruleset `19734348` was then activated and returned only
  the `DeployKey` update bypass.
- A final independent review found a wait-budget mismatch and stale product-spec
  wording. The correction expands each Pages-run wait to 75 minutes, writer jobs to
  180 minutes, adds a regression assertion, and updates the security/operations canon.
- PR #38 merged that correction at `3dc921b`. Main CI run `30162830895` and Pages
  run `30162831002` succeeded; production returned HTTP 200 with current 2026-07-25
  content. The ruleset was restored by an exit-protected maintenance window and API
  verification again showed `active`, `refs/heads/main`, `update`, and only the
  `DeployKey` bypass with one writable verified key.
- Ran the `news`/`fallback` Cloud context formally against live main `3dc921b`.
  It read the current runbook, validated today's terminal `skipped` envelope, and
  returned an idempotent no-op without branch, PR, comment, or main mutation.
- Confirmed no active workflow references Anthropic and deleted the obsolete
  `CLAUDE_CODE_OAUTH_TOKEN`; `CODEX_PUBLISH_DEPLOY_KEY` is now the only repository
  Actions secret.

## Key Decision

Codex Cloud is the unattended researcher/operator, not the production publisher.
It creates one exact candidate PR. Repository-owned trusted code is the only component
that may turn that JSON into a main commit and declare production success.

## Verification So Far

- Node 22.23.1/npm 10.9.8 full gate passes: production audit zero, both validators,
  strict lint, typecheck, 115 tests, and a 176-page static build.
- Focused security/reliability/data suite: 28 passed after the final wait-budget fix.
- All remaining workflow YAML parses; both trusted shell scripts pass `bash -n`;
  all-repository plus staged strict governance and secret gates pass; staged diff
  whitespace is clean.
- During the maintenance window, the still-live legacy scheduled news fallback
  created valid `data/daily-news/2026-07-25.json` (`skipped`) at `d783d8e`, then
  Pages workflow-dispatch run `30162235683` deployed it successfully. The feature
  commit must rebase onto this non-conflicting data-only main update.

## Remaining

1. Observe the first naturally content-producing scheduled candidate and record its
   PR, trusted DeployKey push, and correlated Pages evidence. A synthetic current-day
   write was intentionally not fabricated because both feeds already had terminal
   envelopes and the runbook requires no-op.
2. User-owned follow-ups remain: rotate the previously exposed Aliyun AccessKey and
   confirm the installed-PWA status area on a physical iOS device.

## Post-Session Correction — 2026-07-26

- The eight trigger groups described above were Codex Desktop `heartbeat`
  automations pointing at ChatGPT Work Cloud contexts, not server-hosted schedules.
  Their successful read-only Cloud checks proved the contexts and GitHub connection,
  but did not satisfy the stated requirement to keep the owner's Mac out of the
  availability path.
- The formal fallback no-op proved the runbook's terminal-envelope behavior when a
  Cloud context was invoked; it did not prove that a server scheduler would invoke
  that context unattended. Accordingly, the scheduling and real-candidate acceptance
  criteria in this session were not complete on 2026-07-25.
- The 2026-07-26 failure, scheduler replacement, dual-feed backfill, and production
  evidence are recorded in
  `ai/sessions/2026-07-26--server-scheduled-publishing-recovery.md`.
