# Session: Full Historical Backfill

## Goal

Restore every missing MemeDaily and DailyNews date through the existing trusted one-file
publication boundary, without backdating the public release time or allowing historical
archive replacement.

## Baseline

- GitHub/local `main` is `461777790a0fd4a92a56071babbf24e960c6a309` and the latest
  committed date for both feeds is 2026-08-17.
- Missing memes: 2026-08-18, 2026-08-19, 2026-08-20, and 2026-08-21.
- Missing news: 2026-08-07, 2026-08-08, 2026-08-18, 2026-08-19, 2026-08-20, and
  2026-08-21.
- The trusted publisher accepts only the current Shanghai date. Its score/activity windows
  use final publication time, so an authentic older candidate cannot pass after a delayed
  release without a distinct editorial clock.

## Support Repair

- Historical candidate branches are parsed exactly and bounded to 2026-07-26 through
  Shanghai today, with real-calendar validation.
- Both the read-only validation job and trusted live-tip job require the historical target
  to be absent from `main`. A race or duplicate fails closed; existing historical archives
  never enter repair or migration.
- Both selection schemas accept optional `evaluated_at`. Historical publication requires
  it, validates that its Shanghai date equals `envelope.date`, and rejects it after
  `generated_at` or `published_at`.
- Meme activity/recurrence and news score-time qualification use the evaluation clock when
  present. Trusted stamping preserves it while recording the real current publication time.
- Same-repository, non-draft, one-file, current-policy completion, full checks, post-rebase
  checks, Pages correlation, and final-step DeployKey confinement are unchanged.

## Local Verification

- Focused historical publisher, gate, and workflow security suite: 54 tests passed.
- `npm run check`: production audit found zero vulnerabilities; both full data validators,
  strict lint, typecheck, all 263 tests, and the 253-page static build passed.
- Strict file-size, key-header, import-boundary, secret, state-freshness, complexity,
  whitespace, workflow Bash-block, and workflow YAML checks passed.
- Independent workflow review accepted the fail-closed/create-only historical boundary,
  including valid dates no later than Shanghai today, two live-main absence checks,
  same-day terminal no-op preservation, and unchanged credential confinement.

## Release Pending

- Merge/deploy this support before submitting any missing-date data candidate.
- Publish and production-verify all ten missing feed/date envelopes.
