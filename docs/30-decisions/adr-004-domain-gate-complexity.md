# ADR-004: Accept Red-Line Exceptions for Domain Gate Functions

## Status
Accepted

## Context
AGENTS.md §5 sets quality red-lines (single function ≤30 lines, nesting depth ≤3,
branches ≤3) and requires that any over-limit be documented rather than left silent.

Three publication-gate functions in `src/domain/memedaily/rules.ts` exceed these
thresholds:

- `lifecycleIssues` — two passes over `envelopes → visibleItems → itemNames` (a
  for→for→for shape) reaches nesting depth 4 to build a first-seen map and then flag
  `declining` items younger than 10 days.
- `crossDayIssues` — same envelope→item→name iteration to detect cross-day repeats
  without `days_on_list >= 2`.
- `envelopeIssueSummary` — sequential independent gates (zero-items, per-item evidence,
  run_report accounting, temporal `captured_at <= generated_at`, same-day duplicates).

These are pure, deterministic, fully unit-tested (`rules.test.ts`) data gates whose
structure is inherently iterative (scan every item's normalized names across days).

## Decision
Keep the gate functions as-is and record the exception here rather than refactor.
There is no mechanical linter enforcing the per-function complexity red-lines
(`quality/eslintrc.complexity.example.json` is intentionally dormant — see ADR rationale
below), so the gate is documentation, and these functions are the deliberate exception.

## Alternatives Considered
- **Extract inner loops into helpers** (e.g. `firstSeenByName(envelopes)`): reduces
  nesting but fragments a small, cohesive, well-tested policy across more functions for
  no behavioral gain. Deferred until a function grows materially.
- **Wire the complexity rules into ESLint at error level:** rejected for now — running
  the example rules over `src/**`+`scripts/**` yields ~21 warnings, and `npm run lint`
  uses `--max-warnings=0`, so it would immediately break CI without a refactor sweep.

## Consequences
- Positive: the policy stays in one readable place; tests pin its behavior.
- Negative: the red-line is documented-but-not-mechanically-enforced for these
  functions; reviewers must keep new gate logic cohesive and tested.

## Trade-off
Cohesion and test coverage of the publication policy are prioritized over mechanical
conformance to the per-function size/nesting red-lines for this specific module.
