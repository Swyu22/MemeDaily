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
