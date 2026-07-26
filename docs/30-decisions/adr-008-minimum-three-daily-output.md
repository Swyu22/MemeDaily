# ADR-008: Require at Least Three Daily Items Per Feed

## Status

Accepted. Effective for MemeDaily and DailyNews envelopes dated 2026-07-26 or
later. Earlier repository history remains valid under the contract in force when
it was published.

## Context

The recovered server scheduler proved that a zero-item `skipped` envelope could be
schema-valid, publish successfully, deploy to Pages, and then suppress every later
catch-up as an idempotent no-op. Meme recovery PR #40 demonstrated this failure mode
on 2026-07-26: the publishing machinery worked, but the reader received no items.

The product requirement is stronger than transport success. Each feed must publish
at least three useful items every day. At the same time, an availability target
cannot justify unsafe memes, false news, fabricated citations, private data, or
evidence-free filler.

## Decision

### Minimum and terminal state

For each MemeDaily and DailyNews envelope dated 2026-07-26 or later:

1. The only terminal statuses are `published` and `partial`.
2. `run_report.published` must be at least three.
3. At least three entries in `items` must have `published: true`; existing schema
   and domain checks continue to require the reported and actual counts to agree.
4. `skipped`, `held`, malformed, and fewer-than-three envelopes are under-minimum
   recovery states, not successful terminal results.

Primary, catch-up, and fallback tasks therefore keep working while live `main` is
under minimum. Monitor tasks remain read-only and alert on that condition.

### Bounded quality relaxation

Recovery uses this order:

1. select fully qualified current-day candidates;
2. broaden public discovery while preserving the per-feed scope;
3. revalidate recent, safe carry-over candidates against current public evidence;
4. if necessary, lower only editorial freshness, heat, novelty, or confidence and
   publish the day as `partial`.

The following gates never relax: hard safety exclusions, truthfulness, non-
fabrication, privacy, source URL and evidence requirements, schema validity,
date/time chronology, and exact feed/path containment. A carry-over retains stable
identity and accurate list-age/lifecycle metadata rather than masquerading as a new
item.

If bounded recovery still cannot find three safe, evidenced items, the run fails
closed, raises an alert, and leaves recovery eligible. It must not publish a
zero-item placeholder or invent filler merely to satisfy the count.

### Monotonic exact-file repair

The trusted candidate publisher normally treats live data as immutable. It has one
strict exception for an effective-date envelope that already exists but is under
minimum:

- accept only the same repository, expected daily branch, exact feed/date path, and
  same envelope date;
- validate the candidate with trusted `main` code;
- require the candidate to reach the minimum-three terminal contract;
- preserve every already-visible live item byte-for-byte within the candidate;
- reject replacement once the live envelope is already compliant;
- reject any downgrade, unrelated path, or general historical rewrite.

This makes repair monotonic and race-safe. After the corrected envelope reaches live
`main`, later fixed retries perform the normal cheap preflight and stop before
research or mutation.

### Rollout sequence

The effective-date gate is introduced in three ordered stages to avoid an
availability interlock:

1. deploy the trusted publisher rule that explicitly requires a candidate with at
   least three published items and permits only the under-minimum exact-file repair;
2. use that path for a real same-date daily candidate that repairs
   `data/daily/2026-07-26.json` from `skipped` / zero to a compliant envelope;
3. after the repair path and production result are accepted, enable the effective-
   date domain rejection of `skipped`, `held`, and fewer-than-three envelopes.

This ordering ensures the zero-item live envelope does not become impossible to
replace before its only bounded repair path exists, while still ending with the
minimum enforced mechanically at both candidate publication and domain validation.

## Historical Treatment

PR #40 and its zero-item commit are preserved as audit evidence of the prior policy.
The 2026-07-26 meme envelope is repaired by a later exact-file commit under this ADR;
Git history, the original PR, and its workflow records are not rewritten. Envelopes
before the effective date remain readable and valid so the policy does not
retroactively invalidate the archive.

## Alternatives Considered

- **Keep zero-item `skipped` as terminal:** rejected because transport success would
  continue to mask a failed reader outcome.
- **Require three only in prompts:** rejected because prompt text cannot mechanically
  prevent a zero-item envelope from becoming terminal.
- **Lower every quality and safety threshold:** rejected because quota compliance
  must not create misinformation or unsafe content.
- **Allow arbitrary replacement of daily files:** rejected because it weakens the
  audit trail and reopens publication races.
- **Never replace an existing envelope:** rejected because it would make an early
  zero-item result permanently unrecoverable for that date.

## Consequences

- Positive: a successful daily state now corresponds to a reader-visible minimum,
  not merely a valid JSON file or successful deployment.
- Positive: early under-minimum results remain recoverable without granting broad
  overwrite authority.
- Positive: the repository, prompts, monitors, and server tasks share one terminal
  definition.
- Negative: broad discovery and later recovery runs can consume more Cloud tokens.
- Negative: some `partial` days may contain less fresh or less viral material than
  the preferred editorial bar.
- Negative: an infrastructure or evidence outage may leave the day temporarily
  non-terminal and alerting rather than manufacture content.

The token trade-off is deliberate: once three items are live, later tasks stop after
the inexpensive preflight, but token savings never justify a false terminal result.
When minimum count conflicts with hard safety or truthful evidence, the system fails
closed and keeps the failure visible.

## Verification

- Domain validators reject effective-date `skipped` / `held` and fewer-than-three
  `published` / `partial` envelopes while retaining historical compatibility.
- Workflow tests assert the under-minimum repair exception and the compliant
  existing-envelope no-op.
- Feed monitors require both an allowed terminal status and at least three published
  entries.
- Fallback tooling cannot create a post-cutoff zero-item placeholder.
- End-to-end acceptance checks the repaired JSON on live `main`, its correlated
  successful Pages deployment, and at least three visible items on production.
- All eight server Scheduled Task prompts use this same minimum-three preflight and
  recovery contract.
