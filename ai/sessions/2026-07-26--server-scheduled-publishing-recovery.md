# AI Session Log - 2026-07-26 -- server-scheduled-publishing-recovery

## Session Meta

- Project: MemeDaily
- Device: local Mac workspace + ChatGPT Work Web + GitHub
- Model: Codex
- Task Type: incident recovery / operations / architecture correction
- Tier: milestone
- Start Time: 2026-07-26

## Start Snapshot

- Current goal: find why both 2026-07-26 feeds missed their morning publication,
  replace any local scheduler dependency with genuine server-hosted tasks, backfill
  both feeds, and verify production end to end.
- Scope: eight primary/catch-up/monitor/fallback trigger groups, two current-day
  envelopes, one-file candidate publication, CI, Pages, production, and canonical
  operational state.
- Constraints: keep the owner's Mac outside the availability path; Cloud creates only
  candidate branches/PRs; trusted repository code alone may update protected `main`;
  existing live terminal envelopes remain immutable.
- Acceptance: all eight tasks are visibly server-hosted and active in ChatGPT Work Web,
  all eight local heartbeats are gone, both current-day feeds are live through the
  trusted pipeline, and a real Web Scheduled run proves terminal-day no-op behavior.

## Incident And Root Cause

- At the expected morning publication window, neither
  `data/daily/2026-07-26.json` nor `data/daily-news/2026-07-26.json` existed.
  GitHub had no current-day candidate branch, PR, or Actions run, so the failure
  occurred before trusted candidate ingestion rather than in CI, Pages, the ruleset,
  or the DeployKey.
- The eight supposed Cloud triggers were Codex Desktop `kind = "heartbeat"`
  automations stored locally and pointed at Cloud contexts. A Cloud target context
  does not make a local scheduler server-hosted. With the local scheduler unavailable,
  none of those triggers ran.
- The prior acceptance checked Cloud context/GitHub readability and a manually invoked
  no-op, but did not observe a real server-scheduled invocation. This verification gap
  allowed the scheduling-location error to pass.

## Work Completed

- Deleted all eight local Codex heartbeat automations:
  `dailynews-06-00`, `dailynews-07-15-12-15`, `dailynews-14-45`,
  `dailynews-21-30`, `memedaily-07-00`, `memedaily-08-00-13-00`,
  `memedaily-14-30`, and `memedaily-21-20`.
- Created eight genuine ChatGPT Work Web Scheduled Tasks in Asia/Shanghai:
  - DailyNews: 06:00 primary, hourly 07:15–12:15 catch-up, 14:45 monitor,
    and 21:30 fallback.
  - MemeDaily: 07:00 primary, hourly 08:00–13:00 catch-up, 14:30 monitor,
    and 21:20 fallback.
- Backfilled the meme feed through PR #40 with a valid `skipped` envelope and zero
  items; the trusted publisher accepted it at main `6583aec`.
- Backfilled the news feed through PR #41 with a valid `published` envelope and six
  items; the trusted publisher accepted it at final main `90aa02c`.
- Updated the canonical handoff, project map, ADR, plan, state snapshot, and session
  history to distinguish ChatGPT Work Web Scheduled Tasks from local Desktop
  heartbeats.

## Verification

### Meme publication

- Candidate: PR #40, `status: "skipped"`, zero items.
- Trusted publisher: run `30186891155`.
- Accepted main: `6583aec`.
- Main CI: run `30186948953`, success.
- Correlated Pages: run `30186948929`, success.

### DailyNews publication

- Candidate: PR #41, `status: "published"`, six items.
- Trusted publisher: run `30186938154`.
- Accepted final main: `90aa02c`.
- Main CI: run `30187028830`, success.
- Correlated Pages: run `30187028839`, success.

### Server scheduling and idempotency

- The 12:00 MemeDaily Web Scheduled catch-up displayed `Last ran 12:02`.
- It read the valid terminal `skipped` envelope from live main and stopped before
  research, writing, branch creation, or PR creation.
- The 12:15 DailyNews Web Scheduled catch-up ran at 12:14, read the valid terminal
  `published` envelope with six items, and stopped at the same boundary.
- No additional GitHub mutation appeared after either run. Fixed catch-ups still wake
  and spend one inexpensive live-main preflight; a prior terminal result prevents the
  costly and mutating remainder of the task, not the scheduler invocation itself.

### Production

- A cache-bypassed production request returned HTTP 200.
- Production served the 2026-07-26 meme `skipped` envelope and six published news
  items after the correlated Pages runs.
- Response metadata reported
  `Last-Modified: Sun, 26 Jul 2026 04:00:00 GMT`.

### Repository state

- `npm run check` passed both validators, lint, typecheck, all 115 tests, and a
  176-page static build with the recovered current-day envelopes.
- The production dependency audit reported zero vulnerabilities.
- Strict all-repository state freshness, file-size, key-header, import-boundary, and
  credential checks passed; `git diff --check` was clean.

## Key Decision

Scheduler execution location is an explicit acceptance boundary. A task is considered
unattended only when ChatGPT Work Web shows the Scheduled Task as active and records a
real server-triggered run. A local Codex heartbeat pointing at a Cloud context never
satisfies that boundary.

Terminal-day deduplication is also stated precisely: later fixed tasks may wake and
perform one cheap live-main read, but they must stop before research, data writes,
branches, or PRs once a valid terminal envelope exists.

## Minimum-Three Correction

- The owner rejected zero-item publication days. ADR-008 and both living rules now
  define terminal success as `published`/`partial` with matching reported and
  evidence-qualified visible counts of at least three.
- PR #43 introduced bounded under-minimum repair. Independent review caught a Bash
  heredoc parse failure and held/count/fallback gaps before any repair candidate was
  submitted; PR #44 fixed them at `4c8ac36`.
- The first real three-item candidate check exposed a test coupled to today's zero-item
  fixture. PR #45 replaced it with an isolated two-item fixture; 146 tests and the
  176-page build passed, with an independent review GO.
- Exact candidate PR #46 contained only `data/daily/2026-07-26.json`. Trusted publisher
  run `30191367788` validated and stamped it, committed `ce1c961` to protected `main`,
  waited for CI `30191428315` and correlated Pages `30191428317`, then closed the PR.
- GitHub main and cache-bypassed production now agree on meme `partial/3` and news
  `published/6`. Production returned HTTP 200 and rendered all three repaired meme
  titles.
- All eight ChatGPT Work Scheduled Tasks were updated without changing their names,
  active status, Asia/Shanghai schedules, or next-run cadence. Direct persistent-config
  read-back confirmed terminal `>=3`, operator-held no mutation, fallback recovery
  without `skipped`, and terminal cheap no-op in every task.
- The final meme/news domain gate rejects post-cutoff `skipped` and under-three
  envelopes, counts only evidence-qualified visible items, preserves historical data,
  and keeps `held` as an operator-only emergency removal state. Full verification passes
  158 tests and a 176-page production build.

## Remaining

1. P2: Observe the next naturally content-producing Web Scheduled Task as
   defense-in-depth confirmation that the already verified scheduler and publisher
   paths compose in one unattended run.
2. P1 USER: revoke/rotate the previously exposed Aliyun AccessKey outside this
   repository.
3. P2 USER: refresh/reinstall the iOS Chrome Home Screen app and confirm the dark-mode
   status area on a physical device.
