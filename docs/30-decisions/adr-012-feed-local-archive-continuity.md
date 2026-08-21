# ADR-012: Feed-Local Archive Continuity Through Each Committed Maximum

## Status

Accepted for both MemeDaily and DailyNews archives from 2026-07-26 onward.

## Context

Schema and editorial validators historically checked every file that existed, but did not
notice when one calendar date was absent between later valid archives. A multi-day task
interruption therefore left holes that ordinary CI and Pages builds treated as healthy.

The feeds publish at different times: DailyNews begins at 06:00 and MemeDaily at 07:00 in
Asia/Shanghai. A continuity rule based on wall-clock today or a shared maximum would create
normal false failures during that stagger.

## Decision

- Use 2026-07-26, the effective minimum-output boundary, as the continuity cutoff.
- Evaluate MemeDaily and DailyNews separately from the cutoff through the maximum dated
  filename already present in that same feed.
- Require every calendar date in that closed interval. Report each absent date as a hard
  validation issue in `validate-data.ts` or `validate-news.ts`.
- Ignore dates before the cutoff. Do not extend the range to today and do not use the other
  feed's maximum date.
- Keep the rule in one pure helper so local checks, CI, Pages, and trusted publishing use
  identical date arithmetic.

## Consequences

- Once a later archive exists, an earlier omission cannot remain hidden behind green CI.
  Missing dates must be restored before another full release can pass.
- Because a discontinuous later candidate cannot enter `main`, ordinary recovery can still
  advance the archive one exact next-date file at a time through the trusted publisher.
  The pre-ADR-012 gaps must all be closed before this gate is first released.
- A not-yet-due current-day envelope does not fail continuity, and one feed may validly be
  one date ahead of the other during its scheduled publication window.
- Continuity does not detect an entirely absent tail after a feed's latest committed date.
  Existing current-day policy/completion and deployment-freshness monitors own that separate
  liveness concern.
- Historical data before 2026-07-26 remains untouched and does not acquire a new retroactive
  availability contract.

## Alternatives Considered

- **Require every date through Shanghai today:** rejected because it fails before a feed's
  scheduled run and conflates archive integrity with task liveness.
- **Use the later maximum across both feeds:** rejected because the 06:00/07:00 stagger
  creates a routine cross-feed mismatch.
- **Warn but keep validation green:** rejected because the original failure was precisely a
  silent green archive hole.
- **Rely only on monitors:** rejected because CI, Pages, and trusted writers must share the
  same deterministic archive-integrity boundary.

## Verification Requirements

- Unit tests cover internal missing dates, pre-cutoff history, a continuous interval, and
  two feeds evaluated independently with different maxima.
- Both canonical validators must invoke the shared helper and exit non-zero for its issues.
- After the authorized backfill completes, `npm run check` and strict governance gates must
  pass with no continuity exception or temporary bypass.
