# ADR-010: Make Editorial Completeness, Not Three Items, the Terminal State

## Status

Accepted. Effective for current candidates and live envelopes dated 2026-08-01
or later. This refines ADR-008's count-only terminal definition and ADR-009's
candidate-pool contract while preserving the three-item availability floor,
hard safety/evidence gates, and historical archive compatibility.

## Context

Six consecutive MemeDaily envelopes and five consecutive DailyNews envelopes
ended with exactly three items. Investigation found no code-level maximum of
three: the dynamic meme selector already allowed up to 10. The operational flaw
was that all later Scheduled Tasks treated “three visible items” as complete, so
they exited before proving that broader research would not yield a fourth through
tenth qualified item.

The news line also lacked an independent geography contract. Recent output was
dominated by international institutional and space stories, including routine
foreign-local material with little relevance to ordinary Chinese readers. An
official release established that a claim existed but was mistakenly treated as
evidence that the story was representative or hot.

## Decision

### Editorial completion is the idempotency lock

A scheduled run may cheap-no-op only when the live envelope:

1. uses the exact current policy (`v4-editorial-completeness` for memes or
   `v3-domestic-majority` for news);
2. has `published`/`partial` status and 3–10 evidence-qualified visible items;
3. declares `run_report.selection.editorial_complete:true`; and
4. passes deterministic research, score, selection, composition, and accounting
   checks.

Three remains the recovery floor, never the target. The chosen tier publishes all
permitted highest-scoring qualifiers up to 10. If exactly three qualify, a second
independent source pass itself adds at least 15 unique candidates, records at least
one source scope absent from pass one, and expands the audited pool from at least
30 to at least 45 unique candidates before completion may be declared. The extra
pass may honestly confirm three; it must not manufacture a fourth.

### One-time policy migration

The trusted publisher classifies any same-day legacy-policy envelope as
`policy_migration`, not terminal, whether it contains zero to two or three to ten
items. It may replace that exact dated file once with a fully validated
current-policy envelope. Under-minimum repairs of an already current-policy file
continue to preserve the exact visible prefix. A current-policy envelope with
three or more items and a false/missing completion marker is an incident, and a
completed current-policy envelope is immutable to later scheduled candidates.

### DailyNews domestic-majority contract

For `N` visible news items, domestic scope must be at least `ceil(0.75*N)` and
international scope at most `floor(0.25*N)`. There is no international minimum.
Geography (`scope`) is independent from subject (`topic`).

“Foreign local news” is defined generically, not by a blacklist of countries:
routine municipal, traffic, crime, election, weather, local-event, or institution
publicity whose significance remains mainly within any foreign country/city is
excluded unless it has direct China-reader impact or genuinely representative
global-major-event significance.

International stories require structured audience relevance, two independent
URLs/outlets including state or major media, at most one story per primary
organization, and at most one international space/NASA story. An official source
can prove a fact but cannot alone prove heat. Concrete domestic livelihood policy
news is allowed; only high-signal political propaganda, meeting, leadership,
diplomatic, conflict, and controversy framing remains excluded.

The audience contract is mechanical: `routine_local` is never publishable;
`direct_china_impact` requires `direct_china_public` plus source-matched connection
evidence; `global_major_event` requires `global_systemic` plus audience/heat/evidence
floors of 20/25, 30/40, and 12/15. Common bilingual organization aliases are
normalized before concentration checks. Evidence URL independence removes fragments
and tracking parameters but retains meaningful query identifiers.

### Auditable news selection

News candidates use a 100-point score: heat 40, freshness 20, everyday relevance
25, and evidence 15. Scores of at least 75, 70, and 65 map respectively to
strict-24h, relaxed-48h, and relaxed-72h score tiers, with everyday relevance at
least 15. Actual qualification is the later/weaker of score and event-age tiers,
using `occurred_at` against
`selection.evaluated_at ?? published_at ?? generated_at`; future and older-than-72h
events do not qualify. Stable story identity deduplicates the audit, selected
identity/time matches its item, and safety drops use only opaque `candidate-N`
keys plus a finite category—no identity, time, scope/topic, score, item id, URL,
or content detail. Category counts reconcile exactly with `dropped_safety`. Strict uses
`published`; relaxed tiers use `partial`. Pass totals (including first pass >=30 and
a second-pass new scope), selected mapping, quota/capacity drops, and maximum-count
highest-score selection all reconcile mechanically.

Structured metadata cannot understand every event's significance. The editorial
agent must classify impact honestly from cited evidence; deterministic gates prevent
common shortcuts and inconsistencies but do not replace semantic judgment.

## Alternatives Considered

- **Keep three as terminal and merely ask prompts for more:** rejected because
  later tasks would still stop without proving the larger candidate pool.
- **Always require more than three:** rejected because a real thin day may yield
  exactly three after exhaustive safe research.
- **Ban a named country's news:** rejected because the editorial problem is local
  significance, not nationality.
- **Require one international story:** rejected because it conflicts with the
  domestic-majority product direction and encourages filler.
- **Trust official international sources alone:** rejected because authority and
  representativeness are different claims.

## Consequences

- Positive: the daily count reflects the real qualifying pool rather than a fixed
  three-item shortcut.
- Positive: news defaults to domestic everyday-life relevance with an enforceable
  international ceiling.
- Positive: later Cloud tasks remain inexpensive after true completion.
- Negative: exactly-three days require at least 15 additional audited candidates
  and therefore use more research time/tokens.
- Negative: same-day rollout needs one bounded legacy-policy replacement before
  the normal immutable/no-op state resumes.

## Verification Requirements

- Domain tests reject hidden fourth qualifiers, incomplete pass accounting,
  a first pass below 30, a second pass below 15 additions or without a new source scope, exactly-three
  pools below 45, wrong score/tier/status, invalid news geography
  mix, low everyday relevance, invalid event time/identity, tracking-only URL
  duplication, weak international impact/evidence/relevance, and concentration excess.
- Trusted-publisher tests distinguish `minimum`, `policy_migration`, `terminal`,
  and incident states; migration can replace legacy content once, while minimum
  repair preserves the visible prefix.
- Monitors and fallback guards require exact current policy plus editorial
  completion, not count alone.
- All eight server-hosted Scheduled Task Instructions are synchronized and read
  back without changing their active state or schedules.
- A real same-day candidate for each feed passes the trusted workflow, reaches
  `main`, deploys through Pages, appears in production, and then classifies as a
  cheap no-op.
