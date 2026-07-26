# MemeDaily Product Spec

## Purpose
MemeDaily is an internal-facing, publicly hosted reference desk for content, marketing,
and communications teams. It combines a reusable Chinese-internet meme feed with a
restrained everyday-life news digest. It is not a community, scraper, or private intranet.

## Core Jobs
- **Triage:** understand what is worth noticing today in one to two minutes.
- **Interpret:** see a meme's use, spread mechanism, interesting point, and evidence, or a
  news item's concise factual summary and source context.
- **Lookup:** browse earlier dates, search the meme archive, and open stable detail URLs.

## Feed Contracts
### Memes
- One envelope per day: `data/daily/YYYY-MM-DD.json`.
- From 2026-07-26 onward, every daily envelope exposes 3–10 evidence-qualified items and
  uses only `published` or `partial`.
- Each published item has a stable `id`, title, platforms, type, reader-facing summary,
  origin, usage, fun point, spread reason, lifecycle, internal policy fields, and sources.
- From 2026-07-27, every meme title begins with one semantic emoji chosen for that phrase;
  unrelated items should not mechanically reuse the same prefix.
- From 2026-07-27, each item also carries a display-anchored `canonical_phrase`, exact
  visible `days_on_list`, and auditable `score_breakdown` for heat, freshness,
  reusability, and evidence.
- `brand_usage` and `risk` remain contract/policy inputs but are intentionally not rendered
  as card sections. Editorial output must not become a named-brand recommendation.
- Each source records tier, evidence role, platform, HTTP(S) URL, capture time, and a compact
  title/note. From 2026-07-27, selected items also record the activity `observed_at`
  separately from page capture time. The UI shows concise links, never long excerpts.

### News
- One envelope per day: `data/daily-news/YYYY-MM-DD.json`.
- From 2026-07-26 onward, every daily envelope exposes 3–10 evidence-qualified items and
  uses only `published` or `partial`.
- Items contain a stable id, emoji-led headline, category, summary, heat rank, event time,
  and evidence sources with outlet metadata.
- The feed prioritizes genuinely fresh, everyday-life information and non-political
  international culture, science, technology, sports, or public-interest developments.

### Envelope Integrity
- Both envelopes include version fields, date, `generated_at`, optional `published_at`,
  status, run report, and items.
- Trusted automation stamps pipeline acceptance time after the model artifact is produced;
  the live Pages deployment may complete a few minutes later.
- `generated_at` and every source `captured_at` must not be later than `published_at`.
  `observed_at` must not be later than its source `captured_at`.
- Invalid JSON, schema failures, policy failures, or accounting mismatches block publication.
- From 2026-07-27, a meme report includes `dropped_capacity` and
  `selection.{tier,qualified,candidate_audit}`. The 30–100 post-identity-deduped audit rows
  equal `candidates_scanned`, use one exclusive outcome each, reconcile every selected/drop
  total, derive all three cumulative tier counts, and prove chosen-tier Top-N/capacity
  ordering. Safety drops retain only an opaque counter key and primary category; rejected
  content, subjects, URLs, item ids, scores, and activity are not persisted.
- For current envelopes, `skipped` or fewer than three visible qualified items is an
  under-minimum incident to recover, not a successful terminal day. `held` is a separate
  safety incident. Historical envelopes before 2026-07-26 retain their recorded status.
- `held` remains an operator-controlled emergency takedown. Unattended recovery may repair
  missing, skipped, or 0–2 item output, but may not clear `held` or re-expose its items.

## Evidence, Safety, And Recovery Gates
- Publish only with at least two independent reachable HTTP(S) URLs.
- At least one source must be `platform_public` or `aggregator`; third-tier-only evidence is
  insufficient.
- Store URLs and short notes only. Do not store media, screenshots, comment dumps, login
  state, private account data, or long excerpts.
- Drop politics, disasters/public-safety incidents, crimes/tragedies, celebrity disputes,
  identifiable minors, privacy invasion, doxxing, harassment, attacks, explicit/illegal or
  dangerous content, and harmful rumors.
- A candidate needs a reusable phrase, template, BGM, visual/action pattern, persona, or
  remix structure. A hot one-off news event is not a meme.
- From 2026-07-27, rank at least 30 new and recurring meme candidates together. There is
  no fixed cross-day count or percentage: select by current heat, freshness, demonstrated
  reusability, and evidence quality under the `strict_24h`, `relaxed_48h`, and
  `relaxed_72h` thresholds.
- A recurring meme may continue for as many days as its verified activity warrants, but it
  must be resolved across all meme history, retain the original id/canonical, use the exact
  visible-appearance count, and cite activity observed after its previous site publication
  from a popularity, usage-context, or cross-platform source. Canonical identity must
  normalize to letters/numbers and match the current title or an alias. A held identity is
  never automatically re-exposed. An origin timestamp or recaptured old archive page is not
  evidence of renewed heat.
- DailyNews may recover an under-three day with useful, still-current material from the
  previous 72 hours only when it has never been visibly published in an earlier news
  envelope and still passes the normal authoritative-source gate.
- Recovery may move the meme score floor from 75/24h to 70/48h and finally 65/72h, or
  lower DailyNews heat/freshness/editorial confidence only. Meme reusability remains at
  least 16/20 and evidence at least 7/10. Never fabricate, weaken safety/truth, relax
  source evidence, or cross any content red line to reach three.

## UI Requirements
- Home: same chrome for both tabs, latest date first, up to five days, visible source links,
  status handling, and responsive cards. For scored meme data, heat sorts by
  `score_breakdown.heat` descending (total score breaks ties), while freshness sorts by
  `score_breakdown.freshness` descending. Thus a genuinely fresh recurrence may outrank a
  weaker new item. Historical rows without a breakdown fall back to lifecycle,
  `days_on_list`, and total score; list age is not the primary freshness measure for new data.
- Meme archive: text search plus platform, type, lifecycle, date-range, and sort controls.
- Meme detail: permanent static route, complete reader-facing fields, evidence, history,
  related items, and copy actions.
- Accessibility: keyboard-operable tabs and controls, visible focus, semantic labels, skip
  navigation, live result counts, and wrapping source rows on mobile.
- PWA: same-origin self-hosted fonts/icons/manifest and a network-first service worker whose
  paths adapt to root or GitHub project-subpath hosting.

## Automation Requirements
- Eight ChatGPT Work / Codex Cloud trigger groups run in Asia/Shanghai: news primary
  06:00, hourly catch-up 07:15–12:15, monitor 14:45, fallback 21:30; meme primary
  07:00, hourly catch-up 08:00–13:00, monitor 14:30, fallback 21:20. GitHub cron and
  external cron are not active schedulers.
- The Cloud operator rereads the repository runbook and living rules on every run. A
  content/fallback run may write only the exact dated JSON on the exact same-repository
  `codex/daily-{meme|news}-YYYY-MM-DD` branch and open one non-draft PR. It never updates
  or merges `main`; monitor mode is read-mostly and may only maintain its alert issue.
- A read-only trusted workflow fetches only the candidate JSON blob, never checks out or
  executes the PR tree, stamps chronology, and validates all contracts. A separate job
  resets to live `main`, revalidates after rebase, and exposes the dedicated write deploy
  key only to its final `HEAD:main` push.
- The active `codex-trusted-main` ruleset blocks ordinary users and connected apps from
  updating or merging `main`; its sole bypass type is the trusted publisher DeployKey.
- Publication completes only after a Pages run covering the accepted SHA (or descendant)
  succeeds. The publisher adopts the push-triggered run and explicitly dispatches one
  bounded recovery run only if that run is missing or fails.
- Local Codex is a supervised recovery option. Its prompt is guidance, not an OS sandbox.
- Primary, catch-up, and fallback content runs treat only `published`/`partial` with at
  least three visible evidence-qualified items as terminal. Under-minimum days continue the
  bounded recovery policy; monitors alert but never author content.
- If the bounded recovery pool still cannot produce three compliant items, automation fails
  closed and raises an operational incident. It never fabricates or publishes a 0–2 item,
  `skipped`, or `held` current-day envelope.

## References
- Living meme rules: `../../ai/prompts/MEMEDAILY_DAILY_AUTOMATION.md`
- Living news rules: `../../ai/prompts/DAILYNEWS_DAILY_AUTOMATION.md`
- Architecture decisions: `../30-decisions/`
- Original product rationale: `../../产品方案.md`
