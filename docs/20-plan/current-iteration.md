# Current Iteration

## Iteration Goal

On 2026-08-01, correct the newly observed minimum-count anchoring without weakening the
three-item availability floor. Require both feeds to finish a bounded, auditable
candidate search and publish every qualifying item up to ten. Restore DailyNews to a
China-centered everyday-life mix with at least 75% domestic scope and at most 25%
representative international coverage. Synchronize all eight persistent Cloud prompts
and prove the corrected rules with a real same-day trusted publication and production
readback.

Historical takeover scope and completed acceptance evidence remain below.

Align local, GitHub `main`, and production; repair confirmed reliability/security/data
defects; then replace the stopped Anthropic publisher with fully cloud-hosted Codex
primary, catch-up, monitor, and fallback schedules for both feeds. Correct the
2026-07-26 local-heartbeat deployment error, backfill both feeds, and prove that the
server scheduler and trusted publication path operate without the owner's Mac. Replace
the initial meme `skipped/0` result with a hard per-feed minimum of three safe,
evidence-qualified items and prove the trusted under-minimum repair path. Correct the
subsequent all-prior-day meme board, then replace calendar-based carry-over with an
auditable heat/freshness score that deliberately has no fixed cross-day quota.

## Scope

- **In:** repository/production reconciliation, dependency and CI/Pages security,
  trusted candidate ingestion, publish/deploy correlation, fallback/monitor
  reliability, public data minimization, metadata, cloud prompts, all eight cloud
  schedules, retirement of all eight local heartbeats, 2026-07-26 dual-feed recovery,
  minimum-three recovery policy and monotonic repair, documentation/state/session
  synchronization, 2026-07-26 editorial correction, dynamic meme selection,
  server-task prompt synchronization, and production acceptance.
- **Out:** unrelated visual redesign, historical audit rewrites, private-platform
  extraction, paid model APIs in the product, and unrelated credential/account changes.

## Checklist

### 2026-08-01 editorial-completeness correction

- [x] Fast-forward local `main` to current GitHub `main` and preserve a clean baseline.
- [x] Add backward-compatible editorial-completeness and research-pass contracts to both feeds.
- [x] Require a second pass and at least 45 candidates before an exact-three result is terminal.
- [x] Add independent DailyNews geography/topic fields, domestic/international ratio gates,
  representative international evidence, and auditable Top-N selection.
- [x] Add a one-time trusted migration from today's legacy policy envelopes to the new policy.
- [x] Update the handoff, Cloud runbook, living prompts, project map, ADR, and session state.
- [x] Update and read back all eight server Scheduled Task prompts without schedule changes.
- [x] Pass focused tests, `npm run check`, governance checks, and independent review.
- [x] Merge the rule release while preserving the active DeployKey-only main ruleset.
- [x] Make the legacy-policy fallback regression self-contained so today's successful
  policy migration cannot invalidate the trusted publisher's full test run.
- [ ] Rerun both 2026-08-01 feeds through exact one-file candidates and verify main, Pages,
  production content, counts, mix, and later-task no-op behavior.

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
- [x] Deploy the explicit candidate `>=3` gate and trusted exact-file
  under-minimum-to-complete repair path.
- [x] Replace the 2026-07-26 meme `skipped/0` envelope through the exact daily
  candidate PR and correlated Pages deployment. This restored availability but
  produced an editorial quality incident because all three items repeated 2026-07-25.
- [x] Correct that board through data-only PR #48 with four independently researched
  items, including one genuinely renewed cross-day phrase selected for current heat
  rather than for quota filling; verify main CI, Pages, and production.
- [x] Add distinct semantic leading emoji to all four corrected titles through
  data-only PR #49; verify main CI, Pages, ruleset restoration, and production.
- [x] Define ADR-009 and implement a 30-candidate, 100-point dynamic meme gate with
  `strict_24h` / `relaxed_48h` / `relaxed_72h`, activity timestamps, stable recurrence
  identity, an auditable candidate/capacity ledger, and no fixed cross-day maximum.
- [x] Pass full local/governance validation and independent review for the dynamic gate.
- [x] Merge the dynamic policy, update the server Scheduled Task prompts without
  changing their schedules, and read back all eight persistent task definitions.
- [x] Update and read back all eight server Scheduled Task prompts so only
  `published/partial + >=3` is terminal and fallback performs editorial recovery.
- [x] Activate the domain/monitor/fallback gates, complete full verification, and prove
  local, GitHub main, Pages, and production agree.
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
- Duplicate/catch-up/fallback behavior is a no-op only after a valid live envelope has
  at least three evidence-qualified visible items.
  Fixed retries may still wake and spend one inexpensive live-main preflight, but must
  stop before research, writes, branches, or PRs. Real Web Scheduled no-ops and real
  candidate publications must both be evidenced.
- Local checkout, GitHub `main`, latest successful Pages deployment, and
  `https://memedaily.fun` agree on the accepted commit/content.
- Meme selection does not optimize for a calendar quota. Any number of recurring items
  may rank when each has qualifying score and activity after its previous site
  publication; stale recapture is mechanically rejected.

## Last Updated

- 2026-08-01
