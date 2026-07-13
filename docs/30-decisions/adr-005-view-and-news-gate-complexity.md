# ADR-005: Accept Red-Line Exceptions for View Components and the dailynews Gates

## Status
Accepted

## Context
ADR-004 documented per-function complexity red-line exceptions for the three memedaily
publication-gate functions. Since then the codebase grew a second feed (`dailynews`) and
more view components, so the ADVISORY `npm run lint:complexity` (config
`eslint.complexity.config.mjs`, all rules at `warn`) now surfaces 38 accepted warnings across
17 files. They fall into four families, none of which is a defect:

- **React/JSX view components** — `HomeTabs`, `MemeCard`, `ArchiveClient`, `CopyButtons`,
  `TodayFeed`, `DailyReport`, `NewsCard`, plus `app/page.tsx` / `app/layout.tsx` /
  `app/meme/[id]/page.tsx`. JSX with conditional rendering inflates both line count and
  cyclomatic complexity; the ≤30-line / complexity-≤4 thresholds were written for general
  logic functions, not declarative view trees. Splitting a cohesive card/tab component
  purely to satisfy the metric fragments markup for no behavioral gain.
- **dailynews domain gates** — `src/domain/dailynews/rules.ts` (`redLineIssues` /
  `envelopeIssueSummary` etc.) mirror the memedaily gates already justified by ADR-004:
  pure, deterministic, fully unit-tested, inherently iterative scans.
- **labels sort helpers** — small comparator/sort functions whose branchiness is intrinsic.
- **validation scripts and tests** — the two validators contain a four-level diagnostic
  reporting loop, while the meme rule test suite groups long, cohesive policy scenarios.

## Decision
Keep them as-is and extend ADR-004's reasoning to these families. They stay under the
ADVISORY `npm run lint:complexity` (all `warn`, deliberately NOT part of
`npm run lint --max-warnings=0`), so they are documented + visible but never block CI.
(The 2026-07-01 audit's hardening — http(s)-only source URLs + regression tests — is
orthogonal and unaffected.)

The 2026-07-13 full audit measured 39 warnings before cleanup. One warning introduced by
the new trusted timestamp normalizer was refactored immediately; the remaining 38 are the
accepted families above. Future audits must update this count or refactor/document new
families rather than silently growing the exception.

## Alternatives Considered
- **Refactor view components into smaller subcomponents:** fragments cohesive markup for no
  behavioral gain; deferred until a component grows materially.
- **Promote the complexity rules to error level (or into `npm run lint`):** rejected for the
  same reason as ADR-004 — `npm run lint` uses `--max-warnings=0`, so it would break CI
  without a churny refactor sweep that buys nothing.

## Consequences
- Positive: components and gates stay cohesive and readable; behavior is pinned by tests +
  the Zod contract + the deterministic gates.
- Negative: the per-function size/complexity red-line remains documented-but-not-mechanically-
  enforced for these files; reviewers must keep new view/gate code cohesive and tested.

## Trade-off
Cohesion and test/contract coverage are prioritized over mechanical per-function conformance
for declarative view components and the iterative data gates.
