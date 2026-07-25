# Current Iteration

## Iteration Goal

Align local, GitHub `main`, and production; repair confirmed reliability/security/data
defects; then replace the stopped Anthropic publisher with fully cloud-hosted Codex
primary, catch-up, monitor, and fallback schedules for both feeds.

## Scope

- **In:** repository/production reconciliation, dependency and CI/Pages security,
  trusted candidate ingestion, publish/deploy correlation, fallback/monitor
  reliability, public data minimization, metadata, cloud prompts, all eight cloud
  schedules, documentation/state/session synchronization, and production acceptance.
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
- [x] Create and inspect eight dedicated Cloud task contexts plus eight active
  Asia/Shanghai trigger groups (one heartbeat per Cloud context).
- [x] Run the complete local/governance/security suite and independent diff review;
  correct its final Pages-budget and documentation findings.
- [ ] Merge the final correction, pass main CI/Pages, and verify production.
- [ ] Exercise a real Codex candidate/fallback run and verify idempotent publication.
- [ ] Sync `.cloud.md`, session log/index, and final operational evidence.

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
- All eight task definitions show active Cloud destinations and exact Asia/Shanghai
  cadence.
- The active main ruleset exposes only `DeployKey` as an update bypass, the repository
  has one writable trusted publisher key, and a trusted fallback proves that path works.
- One real candidate is accepted only after trusted checks; duplicate/catch-up behavior
  is a no-op after a terminal live envelope.
- Local checkout, GitHub `main`, latest successful Pages deployment, and
  `https://memedaily.fun` agree on the accepted commit/content.

## Last Updated

- 2026-07-25 22:59 +0800
