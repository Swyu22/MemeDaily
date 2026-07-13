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
- Each published item has a stable `id`, title, platforms, type, reader-facing summary,
  origin, usage, fun point, spread reason, lifecycle, internal policy fields, and sources.
- `brand_usage` and `risk` remain contract/policy inputs but are intentionally not rendered
  as card sections. Editorial output must not become a named-brand recommendation.
- Each source records tier, evidence role, platform, HTTP(S) URL, capture time, and a compact
  title/note. The UI shows concise links, never long excerpts.

### News
- One envelope per day: `data/daily-news/YYYY-MM-DD.json`.
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

## Meme Evidence And Safety Gates
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
- Never fabricate sources or weaken safety to fill a daily quota.

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
- Primary cloud jobs run at about 06:00 (news) and 07:00 (memes), Asia/Shanghai. External
  workflow dispatch is the reliable trigger; GitHub schedules, catch-up, fallback, and
  monitor workflows provide resilience.
- The model-facing job receives public prefetch/search context, cannot run shell commands,
  and can write only the exact dated artifact. It receives only the job-scoped, short-lived
  `contents:read` token and no write credential.
- A separate trusted job checks out clean code, stamps chronology, validates all contracts,
  commits, pushes, and lets GitHub Pages deploy.
- Local Codex is a supervised recovery option. Its prompt is guidance, not an OS sandbox.
- Missing content may publish `skipped`; the system prefers fewer correct items to unsafe,
  weakly evidenced, or fabricated ones.

## References
- Living meme rules: `../../ai/prompts/MEMEDAILY_DAILY_AUTOMATION.md`
- Living news rules: `../../ai/prompts/DAILYNEWS_DAILY_AUTOMATION.md`
- Architecture decisions: `../30-decisions/`
- Original product rationale: `../../产品方案.md`
