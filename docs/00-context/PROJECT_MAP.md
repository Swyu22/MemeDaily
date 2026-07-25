# PROJECT_MAP

## Project Goal
- **Business goal:** give content, marketing, and communications teams a concise daily
  reference desk for Chinese internet memes and useful everyday-life news.
- **Current stage:** a live, dual-feed, static product with evidence-backed content,
  conservative publication gates, permanent archives, and unattended cloud publishing.
- **Success standard:** trusted validation is the only path to publication; a failed or
  missing run leaves the last valid site online and may later publish a `skipped` marker.

## Constraints
- **Collection:** public web intelligence only. No login cookies, private-platform
  extraction, anti-bot circumvention, downloaded media, or comment archives.
- **Hosting:** GitHub Pages at `memedaily.fun`; the repository and generated site are
  public and must contain no secrets or private company material.
- **Storage:** one JSON envelope per feed and date in git; no database, Supabase, runtime
  API, or paid model API in the product.
- **Safety:** meme candidates are dropped conservatively for politics, disasters/public
  safety, privacy/minors, abuse, illegal/explicit content, harmful rumors, and contextual
  risk. News has a separate restrained editorial policy.
- **Automation:** Codex Cloud tasks may submit only an exact same-repository, one-file
  daily candidate PR. Trusted base-code jobs own timestamps, validation, local commits,
  and rebases; a final token-scoped step owns the push and correlated deploy. Repository
  ruleset `codex-trusted-main` prevents the Cloud connector or ordinary users from
  updating/merging main and permits only the dedicated trusted publisher deploy key
  to bypass.

## Module Map
- `src/app/`: Next.js routes, metadata, global/responsive styles, and static composition.
  Depends on `src/features/` and `src/domain/`.
- `src/features/home/`: dual-feed tabs, sorting, status, news cards, and home composition.
- `src/features/memes/`: meme cards, archives, detail helpers, and list behavior. Depends
  on `src/domain/memedaily/`.
- `src/domain/memedaily/`: meme schema, loaders, evidence/safety/lifecycle gates, and
  deterministic history calculations. It has no UI or infrastructure dependency.
- `src/domain/dailynews/`: news schema, loaders, labels, freshness, editorial gates, and
  deterministic history calculations. It has no UI or infrastructure dependency.
- `scripts/`: validation, skipped-envelope generation, trusted publish-time stamping,
  public hot-list prefetching, font generation, and governance checks.
- `.github/workflows/`: CI, Pages, trusted Codex candidate ingestion, manual
  fallback/monitor recovery, and cloud-fetch diagnostics. Official actions are pinned
  to commit SHAs.
- `data/daily/` and `data/daily-news/`: product content sources of truth.
- `public/`: same-origin fonts, PWA manifest/icons/service worker, domain token, and CNAME.
- `ai/`: operational prompts and one-file-per-session handoffs.
- `docs/project/`: historical design export; excluded from production lint semantics.

## Dependency Rules
- Routes compose features; features call domain; domain stays pure and data-oriented.
- UI must not import automation scripts.
- Domain must not import Next.js, React, route components, or workflows.
- Scripts may use domain contracts but must not import UI.
- `scripts/checks/check-import-boundaries.sh` enforces the declared paths.

## Data And Publication Contracts
- **Meme envelope:** `data/daily/YYYY-MM-DD.json`
- **News envelope:** `data/daily-news/YYYY-MM-DD.json`
- **Evidence tiers:** `platform_public`, `aggregator`, `search_media`, `spillover`
- **Meme publication minimum:** two independent HTTP(S) URLs with at least one
  `platform_public` or `aggregator` source, plus a reusable meme shell and all safety gates.
- **Trusted chronology:** publication jobs set `generated_at` and `published_at`; sources
  cannot claim capture after publication.
- **News attribution:** every reader-visible DailyNews source has a required `outlet` label.
- **Runtime:** static files only; there is no backend API.

## Automation Map
- ChatGPT Work / Codex Cloud Scheduled tasks: news primary 06:00 and meme primary
  07:00 Asia/Shanghai, plus the original staggered catch-up, monitor, and late
  fallback cadence. Durable behavior lives in `ai/prompts/CODEX_CLOUD_RUNBOOK.md`.
- `codex-daily-pr-publish.yml`: same-repository exact-branch/one-JSON candidate
  ingestion, trusted validation, serialized main publication, and correlated Pages wait.
- `daily-{news-}fallback.yml`: manual-only validated skipped-marker disaster recovery.
- `daily-{news-}monitor.yml`: manual-only live-main/Pages operational verification.
- `pages.yml`: build and deploy the static export after trusted changes.
- `ci.yml`: source, data, governance, secret, type, test, and build gates.

## Reading Path
- **Bug fix:** `.cloud.md` -> target module README -> target and adjacent files.
- **Feature:** add the active plan and relevant spec.
- **Architecture/automation:** add this map, ADRs, workflows, and operational prompts.
- **Audit handoff:** add `docs/40-audits/` and the active session log.
