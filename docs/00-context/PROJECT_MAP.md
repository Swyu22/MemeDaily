# PROJECT_MAP

## Project Goal
- **Business goal:** give content, marketing, and communications teams a daily
  Chinese meme reference desk for topic selection and brand-use judgment.
- **Current stage goal:** ship the first GitHub Pages static version with file-backed
  daily data, conservative validation, and local Codex automation.
- **Success standard:** a valid daily JSON commit rebuilds the site; invalid or weak
  data is rejected or downgraded to `skipped` without breaking the previous site.

## Constraints
- **Collection:** public web intelligence only. No login cookies, no private platform
  scraping, no media downloads, no comment archives.
- **Automation:** Primary publisher is GitHub Actions `daily-publish.yml` (cloud cron
  ~07:40 Asia/Shanghai; content ready ~08:00 as shown in the UI), with `daily-catchup`,
  `daily-fallback`, and `daily-monitor` for resilience. The local Mac Codex run is an
  optional manual fallback only.
- **Hosting:** GitHub Pages + `memedaily.fun`; repo remains public on GitHub Free.
- **Storage:** JSON files in git; no Supabase, database, or OpenAI API.
- **Safety:** conservative drop policy for politics, social tragedies, celebrity
  controversies, minors, privacy, attacks, explicit/illegal/violent/rumor content.

## Module Map
- `src/app/`: Next.js routes and page composition. Depends on `src/features` and
  `src/domain`.
- `src/features/memes/`: UI-facing meme list/detail/search behavior. Depends on
  `src/domain/memedaily`.
- `src/domain/memedaily/`: data loading, schema-derived types, lifecycle/status
  rules, evidence thresholds. Must not depend on UI or infrastructure.
- `scripts/`: local and CI command-line tasks: validate data, create skipped days,
  and support automation.
- `.github/workflows/`: CI (`ci`, `pages`) plus daily automation — `daily-publish`
  (primary), `daily-catchup` (re-publish if missed), `daily-fallback` (skip marker),
  `daily-monitor` (alert), `cloud-fetch-check` (cloud-IP probe).
- `data/daily/`: one JSON envelope per date. This is the product content source of
  truth.
- `docs/project/`: design prototype exported from Claude Design; read-only reference.
- `ai/prompts/`: reusable prompts for Codex automation and handoffs.

## Dependency Rules
- Routes compose features; features call domain; domain stays pure and file/data
  oriented.
- UI must not import automation scripts.
- Domain must not import Next.js, React, or route components.
- Automation scripts may read domain schema/contracts but should not import UI.
- Enforced by `quality/import-boundaries.txt` once source files exist.

## Data/API
- **Daily envelope:** `data/daily/YYYY-MM-DD.json`
- **Evidence tiers:** `platform_public`, `aggregator`, `search_media`, `spillover`
- **Required publication gate:** each item needs at least two independent URLs and at
  least one `platform_public` or `aggregator` source.
- **Build API:** static build reads local JSON only; runtime has no backend API.

## Docs Index
- Product plan: `产品方案.md`
- Spec: `docs/10-spec/memedaily-product-spec.md`
- Plan: `docs/20-plan/current-iteration.md`
- ADRs: `docs/30-decisions/`
- Sessions: `ai/sessions/`

## Reading Path
- **Bug fix:** `.cloud.md` -> module README -> target file.
- **Feature:** `.cloud.md` -> `docs/20-plan/current-iteration.md` -> relevant spec.
- **Architecture/automation:** add this file, ADRs, and `ai/prompts/`.
