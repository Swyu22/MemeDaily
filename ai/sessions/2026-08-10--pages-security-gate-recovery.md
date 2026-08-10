# Session: Pages Security-Gate Recovery

## Goal

Restore the public site after the 2026-08-08 through 2026-08-10 production freeze,
align the trusted writer and Pages security gates, and ensure deployment freshness is
reported even when a feed also has an editorial incident.

## Reproduction

- Local `main` was fast-forwarded from `0ea5105` to live GitHub `main` `075045e`.
- Live `main` contained MemeDaily envelopes for 2026-08-08 through 2026-08-10 and
  DailyNews envelopes for 2026-08-09 through 2026-08-10. Scheduled candidate branches,
  PRs, and trusted-publisher runs proved that the server tasks continued running.
- Cache-bypassed production returned HTTP 200 but `Last-Modified` remained
  2026-08-07 00:11 UTC. The page exposed the 2026-08-07 meme board and 2026-08-06
  news board; a 2026-08-10 meme detail route returned 404.
- Every later CI and Pages build failed at the production dependency audit because
  `next -> postcss -> nanoid@3.3.16` matched high-severity advisory
  `GHSA-2v37-7h3g-55p8` (`nanoid <3.3.17`).

## Root Cause

The trusted candidate publisher ran `npm run check` before pushing, while only CI and
Pages ran the production dependency audit. A new advisory could therefore make a tree
undeployable after candidate validation without stopping the trusted writer from first
advancing `main`. The subsequent Pages failure left accepted data commits in `main`,
production stale, and candidate PRs open because their close step waits for Pages.

DailyNews also has two independent historical candidate failures: the 2026-08-07
candidate had a score/time-derived tier mismatch, and the 2026-08-08 candidate claimed
a source capture after the trusted publication clock. They were correctly rejected and
must not be repaired by fabricating historical timestamps.

## Repair

- Refreshed the transitive lock from `nanoid@3.3.16` to `nanoid@3.3.18`; the production
  audit now reports zero vulnerabilities.
- Added `audit:prod` and made it the first part of canonical `npm run check`, which is
  already executed by candidate validation, live preparation, post-rebase validation,
  manual fallback writers, and Pages.
- Updated workflow security coverage to require audit inclusion in the canonical gate.
- Changed both deterministic monitors and the Cloud runbook/template so Pages freshness
  is checked independently from content validity. A content incident can coexist with a
  separate stale-deployment alert.
- Recorded the architecture amendment in ADR-007 and updated the active plan/state.

## Local Verification

- `npm ci`: installed the refreshed lock successfully.
- `npm run audit:prod`: zero production vulnerabilities.
- `npm run check`: both data validators, strict lint, typecheck, 257 tests, and a
  232-page static build passed.

## Release Pending

- Merge the maintenance PR while temporarily suspending only the protected-main
  ruleset required for code maintenance, then restore and reverify the ruleset.
- Require successful main CI and Pages for the repaired commit.
- Verify cache-bypassed production exposes the 2026-08-10 dual-feed content and detail
  routes, then close stale data PRs whose files are already in main.
- Synchronize and read back the eight server Scheduled Task prompts without changing
  title, active state, timezone, or recurrence.
