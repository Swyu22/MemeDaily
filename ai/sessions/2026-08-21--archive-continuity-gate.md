# Milestone Summary: Feed-Local Archive Continuity Gate

## Goal

Make every internal MemeDaily or DailyNews archive omission from 2026-07-26 onward a
canonical validation failure, while preserving the feeds' independent 06:00 and 07:00
publication cadence.

## Design

- `scripts/data-continuity.ts` receives one feed's dated JSON filenames and returns every
  missing calendar date from 2026-07-26 through that same feed's maximum filename date.
- Dates before the cutoff do not influence the result. The helper does not compare feeds
  and deliberately does not extend the interval to the wall-clock date.
- Both `validate-data.ts` and `validate-news.ts` report every gap and include it in their
  existing non-zero issue count, so CI, Pages, trusted publishers, and local checks share
  the same failure.
- ADR-012 records why the interval uses each feed's committed maximum rather than today or
  a cross-feed maximum, and keeps tail freshness as a separate monitor responsibility.

## Delivered Files

- Shared helper and focused tests: `scripts/data-continuity.ts` and
  `scripts/data-continuity.test.ts`.
- Canonical gate integration: `scripts/validate-data.ts` and `scripts/validate-news.ts`.
- Contract and governance sync: scripts/docs indexes, product spec, project map, active
  plan/state, and ADR-012.

## Verification

- Focused Vitest: 4/4 passing for internal gaps, pre-cutoff history, a continuous range,
  and independent feed maxima.
- Before final backfill, the wired validators failed on the exact absent filenames, proving
  that both entry points execute the helper rather than merely unit-testing it in isolation.
- Rebased on final backfill parent `03b3db9`, `npm run check` passes: zero production audit
  findings, both continuous data validators, strict lint, typecheck, 270/270 tests, and a
  263-page static build.
- Targeted complexity, strict file-size/header/import/secret/state governance, staged
  pre-commit checks, and `git diff --check` pass. Independent review returned GO after its
  cleanup findings were resolved with ADR-012, accurate plan state, and a clean worktree.

## Release Boundary

This branch changes validation and documentation only. It does not create or modify any
daily envelope, publish to GitHub, or alter Cloud schedules.

## Final Release Acceptance

- Backfill data parent `03b3db9abb18d7c2622a6f8081ee9a1a9dfd8860` contains all ten
  restored feed/date files. Continuity PR #123 then merged at accepted data-and-gate main
  `39dc7604f3de88f0cf9ef5a064699481db2d6f21`.
- Main CI `32450237750` and Pages `32450237637` succeeded on that exact SHA. A final local
  `npm run check` also passed with zero production-audit findings, both continuous
  validators, strict lint/typecheck, 270/270 tests, and a 263-page build.
- Mechanical inventory found 27/27 dates and zero gaps per feed for 2026-07-26..2026-08-21.
  Restored MemeDaily counts are 3, 3, 4, 4; restored DailyNews counts are 4, 4, 5, 4, 4,
  4, with every restored news item classified domestic and `民生社会`.
- Cache-bypassed production returned HTTP 200 for home, archive, and the stable cross-day
  meme route, with current titles present. The superseded identity route returned 404.
- The repository ruleset was read back as active with DeployKey as its sole bypass, no
  `codex/daily-*` PR remained open, and local/GitHub main matched before this closeout.
