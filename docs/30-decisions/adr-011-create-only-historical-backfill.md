# ADR-011: Create-Only Historical Backfill With Split Editorial and Publish Clocks

## Status

Accepted for explicitly authorized missing-date recovery from 2026-07-26 onward.
This extends ADR-007's exact candidate publisher without weakening immutable archives,
the one-file boundary, current policy, full validation, or the DeployKey trust boundary.

## Context

Server-side usage exhaustion can leave multiple dates absent even though the publisher,
schema, and production site remain healthy. The trusted workflow previously accepted only
the current Shanghai date. Reusing today's real publication clock to judge an older day's
24/48/72-hour evidence window would also reject authentic historical candidates or tempt an
operator to falsify publication timestamps.

## Decision

- Accept exact `codex/daily-{meme|news}-YYYY-MM-DD` candidates from 2026-07-26 through
  Shanghai today. Reject invalid calendar dates, earlier dates, and future dates.
- A historical candidate is create-only. Both the read-only validation job and the trusted
  live-tip job independently require the exact target to be absent from `main`. Existing
  historical envelopes remain immutable and cannot enter minimum repair or policy migration.
- Keep the existing same-repository, non-draft, one-target-file, trusted-base checkout,
  full `npm run check`, post-rebase recheck, and final-step DeployKey constraints unchanged.
- Add optional `run_report.selection.evaluated_at` to both current selection contracts.
  Historical candidates must provide it. It must resolve to `envelope.date` in
  Asia/Shanghai and must not be later than `generated_at` or `published_at`.
- Meme activity windows, meme recurrence publication ordering, and DailyNews event-age
  qualification use `evaluated_at` when present, falling back to
  `published_at ?? generated_at` for existing archives and normal same-day candidates.
- The trusted stamp always writes the real current `generated_at` and `published_at` and
  preserves `evaluated_at`. Source capture times remain real; no timestamp is backdated to
  simulate an earlier release.

## Security And Integrity Properties

- A historical PR cannot overwrite or reinterpret a published archive, even if it contains
  a valid current-policy envelope.
- A race that creates the target after read-only validation fails closed at the trusted
  live-tip recheck before any commit or publication credential is exposed.
- Editorial qualification describes what was timely on the target date; reader-facing
  publication metadata truthfully describes when the backfill actually went live.
- All feed evidence, safety, candidate-ledger, minimum-three, Top-N, and domestic-majority
  gates remain identical to same-day publication.

## Alternatives Considered

- **Backdate `published_at`:** rejected because it falsifies the public release time.
- **Evaluate history against today's publish time:** rejected because genuine target-day
  evidence would mechanically age out.
- **Allow historical repair/replacement:** rejected because it widens a bounded recovery
  into archive mutation and creates race/duplication ambiguity.
- **Bypass the trusted publisher for a bulk commit:** rejected because it removes one-file
  validation, credential confinement, and per-date deployment evidence.

## Verification Requirements

- Domain tests prove both selectors use `evaluated_at`, reject a wrong target date, reject
  a clock after generated/published, and preserve it while stamping real publication time.
- Publisher tests require the bounded date range, an exact branch and single file, absence
  on trusted main in both jobs, and a historical evaluation clock.
- `npm run check` and workflow Bash parsing pass before the support change is released.
- Operational backfill still publishes one date/feed candidate at a time and correlates the
  resulting main commit with Pages and production before claiming completion.
