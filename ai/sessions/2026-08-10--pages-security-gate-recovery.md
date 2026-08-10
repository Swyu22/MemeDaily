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

## Release Acceptance

- Recovery PR #96 merged under the bounded protected-main maintenance procedure at
  `20ab8d3931cf0f240e8a520fe3e2056b99832427`. Main CI `31357545712` and Pages
  `31357545705` succeeded; the ruleset was restored active with only its DeployKey
  bypass.
- Data-only PR #95 then corrected the three 2026-08-10 meme `why_spread` explanations
  at `08ec7b566a95eabac4c2c316f0124856433fea79`. It preserved item identity,
  evidence, scores, order, counts, and timestamps. Final main CI `31357640258` and
  Pages `31357640237` succeeded.
- Cache-bypassed production returned HTTP 200/MISS with a 2026-08-10
  `Last-Modified`, all three current meme titles, all three current DailyNews
  headlines, and HTTP 200 for every current meme detail route.
- Deterministic monitor runs `31357738935` (meme) and `31357741553` (news) both
  succeeded against exact final main/Pages `08ec7b5`, classifying each current-policy
  three-item envelope as terminal.
- Daily PRs #86, #89, #90, #92, and #93, whose data had already reached `main`, were
  closed after the Pages descendant deployed. Rejected historical PRs #82 and #85
  were closed with their integrity failures recorded rather than inventing backdated
  evidence. Editorial incident #94 was closed after the corrected production readback.
- Local `main`, `origin/main`, and GitHub `main` matched `08ec7b5` before this
  documentation-only closeout. The active ruleset exposes only DeployKey as a bypass,
  and the sole repository deploy key is verified, enabled, and writable.
- Dated candidate branches, PRs, and publisher runs prove the eight server schedules
  continued during the outage; they were not the failed component and no schedule was
  changed. The monitor contract was updated in the live runbook/template that every
  invocation rereads. An additional eight-task UI prompt readback was not claimed
  because the available browser session was not authenticated.
