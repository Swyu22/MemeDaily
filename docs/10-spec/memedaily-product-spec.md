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
- `brand_usage` and `risk` remain contract/policy inputs but are intentionally not rendered
  as card sections. Editorial output must not become a named-brand recommendation.
- Each source records tier, evidence role, platform, HTTP(S) URL, capture time, and a compact
  title/note. The UI shows concise links, never long excerpts.

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
- Invalid JSON, schema failures, policy failures, or accounting mismatches block publication.
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
- When the strict meme pool is under three, search the previous 7 days, then allow safe
  carry-over from the previous 14 days with public evidence newly opened or rechecked
  within 72 hours. Carry-over reuses the exact stable id and correct `days_on_list`.
- DailyNews may recover an under-three day with useful, still-current material from the
  previous 72 hours only when it has never been visibly published in an earlier news
  envelope and still passes the normal authoritative-source gate.
- Recovery may lower heat, freshness, or editorial confidence only. Never fabricate,
  weaken safety/truth, relax source evidence, or cross any content red line to reach three.

## UI Requirements
- Home: same chrome for both tabs, latest date first, up to five days, heat/freshness sorting,
  visible source links, status handling, and responsive cards.
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
