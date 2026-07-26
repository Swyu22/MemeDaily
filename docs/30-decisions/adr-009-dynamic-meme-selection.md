# ADR-009: Select Recurring Memes by Current Heat and Freshness

## Status

Accepted. Effective for MemeDaily envelopes dated 2026-07-27 or later. It refines
ADR-008's bounded meme recovery policy without changing the minimum-three terminal
contract, the trusted publication boundary, or historical envelopes.

## Context

The first 2026-07-26 minimum-three repair reused all three items from the prior
day. Those items passed the former 7/14-day carry-over wording, but the evidence
did not establish three genuinely current editorial choices. The rule rewarded
calendar eligibility rather than present heat and made an old archive page with a
new capture time too easy to treat as fresh.

A proposed fixed cap such as “at most one cross-day item” would create the
opposite error. A phrase can remain the strongest meme for several days or surge
again on a new platform. A genuinely hot recurring meme should not lose to a weak
new phrase merely because its first appearance was yesterday.

## Decision

### One ranked pool, no cross-day quota

Each run ranks at least 30 real new and recurring candidates together. There is no
minimum, maximum, or percentage assigned to cross-day items. Any number, including
the whole board, may recur when every item independently clears the current score
and activity gates. An old item without renewed qualifying activity is ineligible
even when the board would otherwise have fewer than three items.

### Auditable 100-point score

Every selected item records a stable `canonical_phrase` and four integer
components whose sum exactly equals `score`:

- heat, 0–40: verified current rank, reach, interactions, duration, trajectory,
  and cross-platform acceleration;
- freshness, 0–30: recency of the evidenced activity, including a genuine
  current-day second wave;
- reusability, 0–20: demonstrated public copying, filling-in, or use in unrelated
  contexts, with a non-relaxable minimum of 16;
- evidence, 0–10: source independence, platform/public context, and timestamp
  quality, with a non-relaxable minimum of 7.

Selection starts with `strict_24h`: score at least 75 and activity within 24 hours,
using `status: "published"`. If fewer than three qualify after broad discovery,
the run may use `relaxed_48h`: score at least 70 and activity within 48 hours, then
`relaxed_72h`: score at least 65 and activity within 72 hours. Either relaxed tier
uses `status: "partial"`. The score never drops below 65.

### Auditable candidate pool and capacity

The ranked pool contains 30–100 unique, post-identity-deduped candidates.
`candidates_scanned` equals the exact `selection.candidate_audit` length. Each
candidate has a unique key, each non-safety row has a unique stable canonical
phrase, and each row has exactly one mutually exclusive outcome: selected, safety
drop, low-confidence drop, insufficient-evidence drop, or capacity drop.

`selection.qualified` contains three cumulative counts derived from those rows.
The run must use the first, strictest tier with at least three qualifiers. The
selected count is `min(10, qualified[chosen tier])`, selected rows are that tier's
highest scores, and any additional qualifiers become `dropped_capacity`. Every
published/drop count in the run report must equal its audit outcome count.

Safety rows deliberately minimize public data: they contain only an opaque
`candidate-N` key, `dropped_safety`, and one primary categorical `drop_reason`.
They must not contain the rejected phrase, subject, URL, item id, score,
breakdown, or activity. Other outcomes do not use `drop_reason`.

### Activity time is not capture time

Every selected item has at least one source `observed_at`: the time the evidence
shows or demonstrates the meme activity. `captured_at` records only when the
operator opened the page. `observed_at` cannot be later than `captured_at`, and
changing `captured_at` on an old page does not make old activity fresh.

### Stable recurrence identity

A recurring meme retains the id from its first visible board appearance.
`days_on_list` equals its exact number of visible board appearances, including
the current day. Every finalist is resolved across the complete
`data/daily/*.json` history, including held envelopes; a recent-day window is
discovery context, not an identity or recurrence limit. The canonical phrase must
normalize to letters/numbers, match the normalized current title or an alias, and
remain anchored to its earliest identity. A held identity is never automatically
re-exposed. At least one current source must have `observed_at` later than the
meme's previous site publication. That source must demonstrate popularity, usage
context, or cross-platform activity; an `origin` timestamp alone is insufficient.
Otherwise the recurrence fails even if its URL still loads.

Hard content/safety rules, truthfulness, source authenticity, two-URL evidence,
chronology, privacy, schema validity, and the reusability/evidence floors never
relax to reach the daily minimum.

## Implementation

- The schema adds backward-compatible `canonical_phrase`, `score_breakdown`,
  source `observed_at`, `dropped_capacity`, and
  `run_report.selection.{tier,qualified,candidate_audit}` fields.
- Domain validation hard-requires them from 2026-07-27, verifies the score,
  tier/status/age window, candidate ledger and privacy, strictest sufficient
  tier, Top-N/capacity accounting, stable full-history identity/list count, and
  post-publication activity for recurrence.
- Reader sorting uses the `heat` component for heat and the `freshness` component
  for freshness; historical data without breakdowns keeps its lifecycle/list-day
  fallback. A genuinely fresh recurrence can therefore outrank a weaker new item.
- Living and Cloud rules use the same thresholds and explicitly reject fixed
  cross-day quotas.
- Earlier data remains valid. The 2026-07-26 editorial correction was published
  separately through data-only PR #48 with four independently reverified items.

## Alternatives Considered

- **At most one cross-day item:** rejected because a real multi-day trend or
  second-wave surge can legitimately occupy more than one slot.
- **Prefer new items before scoring:** rejected because calendar novelty is not
  evidence of heat, reusability, or quality.
- **Keep the 7/14-day carry-over ladder:** rejected because age eligibility does
  not establish current activity and encouraged mechanical reuse.
- **Use `captured_at` as freshness:** rejected because reopening an old page proves
  page access, not renewed propagation.
- **Ban all recurrence:** rejected because it would hide real continuing trends
  and make the daily board less accurate.

## Consequences

- Positive: cross-day decisions follow current evidence rather than an arbitrary
  quota.
- Positive: every selected item exposes an auditable score and activity clock.
- Positive: genuine continuing or second-wave memes remain eligible for as long as
  their measured strength warrants.
- Negative: research must examine a larger pool and record more structured
  evidence, increasing editorial and Cloud-token cost on under-minimum days.
- Negative: deterministic validation can verify accounting and chronology but
  cannot fully replace editorial judgment about the meaning of public metrics.

## Verification Requirements

- A regression test accepts a board made entirely of recurring memes when every
  item has qualifying post-publication activity.
- Tests reject stale recurrence, changed/empty/unanchored canonical identity,
  wrong list count, held re-exposure, invalid score/tier/status, fewer than 30
  audited candidates, mismatched outcome/qualification totals, unjustified
  relaxation, a hotter capacity drop, private safety-audit details, and activity
  newer than its capture time.
- A long-gap second wave and an all-recurring board pass when their current
  evidence qualifies; heat/freshness UI tests use score components rather than a
  calendar-newness preference.
- All eight server Scheduled Tasks retain their schedules and cheap terminal
  preflight; MemeDaily authoring prompts adopt this decision before the next run.
