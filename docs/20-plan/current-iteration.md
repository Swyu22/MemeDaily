# Current Iteration

## Iteration Goal

Align local, GitHub `main`, and production; repair confirmed reliability/security/data
defects; then replace the stopped Anthropic publisher with fully cloud-hosted Codex
primary, catch-up, monitor, and fallback schedules for both feeds. Correct the
2026-07-26 local-heartbeat deployment error, backfill both feeds, and prove that the
server scheduler and trusted publication path operate without the owner's Mac.

## Scope

- **In:** repository/production reconciliation, dependency and CI/Pages security,
  trusted candidate ingestion, publish/deploy correlation, fallback/monitor
  reliability, public data minimization, metadata, cloud prompts, all eight cloud
  schedules, retirement of all eight local heartbeats, 2026-07-26 dual-feed recovery,
  documentation/state/session synchronization, and production acceptance.
- **Out:** unrelated visual redesign, historical audit rewrites, private-platform
  extraction, paid model APIs in the product, and unrelated credential/account changes.

## Checklist

- [x] Fast-forward local `main` and prove local HEAD, remote `main`, latest Pages
  deployment, and production baseline agree.
- [x] Upgrade vulnerable production dependencies, pin Node/npm runtime expectations,
  add production high-severity audit gates, and downscope Pages permissions.
- [x] Harden fallback paths, live-tip dedup, Pages dispatch retries/correlation,
  empty-news validation, fallback date containment, and regression tests.
- [x] Minimize reader-facing meme payloads and restore canonical detail metadata.
- [x] Remove the stopped Anthropic publishers and repository/external cron ownership.
- [x] Add the same-repository, exact-branch, one-JSON Codex candidate workflow with
  trusted stamping/check/rebase/push/Pages boundaries.
- [x] Add ADR-007 and durable Codex Cloud primary/catch-up/monitor/fallback runbooks.
- [x] Activate and API-verify deploy-key-only `codex-trusted-main` plus its sole
  writable key (end-to-end push proof remains in the candidate acceptance item).
- [x] Diagnose the 2026-07-26 outage as eight local Codex Desktop heartbeats that
  pointed at Cloud contexts but were not server-hosted schedules.
- [x] Delete all eight local heartbeats and create/read back eight genuine ChatGPT
  Work Web Scheduled Tasks with the exact Asia/Shanghai cadence.
- [x] Backfill the 2026-07-26 meme and news envelopes through one-file candidate PRs
  #40 and #41 and the trusted DeployKey publisher.
- [x] Correlate both accepted main commits with successful CI and Pages runs and verify
  cache-bypassed production HTTP 200 with current dual-feed content.
- [x] Observe the real 12:00 meme and 12:15 news Web Scheduled catch-up runs; prove
  both terminal live-main preflights caused no-ops with no additional GitHub mutation.
- [x] Run the complete local/governance/security suite and independent diff review;
  correct its final Pages-budget and documentation findings.
- [x] Merge the final correction, pass main CI/Pages, restore protection, and verify
  production.
- [x] Exercise a formal Cloud fallback run and verify terminal-day idempotent no-op.
- [x] Retire the unreferenced Anthropic OAuth secret.
- [x] Sync `.cloud.md`, session log/index, and final operational evidence.

## High-Risk Areas

- Public-web prompt injection must not reach commands, trusted code, or a production
  token; the cloud task is a candidate producer, never a main publisher.
- `pull_request_target` must never check out or execute the candidate tree.
- All automatic main writers must share one concurrency group and verify the live tip
  before creating data.
- A git push is not production success; the publisher must wait for a Pages run covering
  the accepted commit (or descendant).
- Scheduled tasks must be genuinely Cloud-backed and keep running when the Mac is off.
- The connected Cloud GitHub tool must be mechanically unable to update or merge main.

## Acceptance Standard

- `npm run check`, production dependency audit, strict governance gates, action-pin and
  workflow-security tests, YAML/shell parsing, and diff checks pass.
- All eight ChatGPT Work Web task definitions show active Cloud execution and the
  exact Asia/Shanghai cadence; no local Codex heartbeat remains in the availability
  path.
- The active main ruleset exposes only `DeployKey` as an update bypass, the repository
  has one writable trusted publisher key, and a trusted fallback proves that path works.
- Duplicate/catch-up/fallback behavior is a no-op after a terminal live envelope.
  Fixed retries may still wake and spend one inexpensive live-main preflight, but must
  stop before research, writes, branches, or PRs. Real Web Scheduled no-ops and real
  candidate publications must both be evidenced.
- Local checkout, GitHub `main`, latest successful Pages deployment, and
  `https://memedaily.fun` agree on the accepted commit/content.

## Last Updated

- 2026-07-26 12:18 +0800
