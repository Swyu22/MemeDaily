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
- **Automation:** model-facing jobs cannot execute shell commands or edit arbitrary paths.
  Trusted no-token steps own timestamps, validation, local commits, and rebases; a final
  token-scoped step owns the push and correlated deploy.

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
- `.github/workflows/`: CI, Pages, two primary publishers, catch-up, fallback, monitor,
  and cloud-fetch diagnostics. Official actions are pinned to commit SHAs.
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
- `daily-news-publish.yml`: news publisher, about 06:00 Asia/Shanghai.
- `daily-publish.yml`: meme publisher, about 07:00 Asia/Shanghai.
- `daily-{news-}catchup.yml`: redispatch after a missed primary run.
- `daily-{news-}fallback.yml`: publish a validated skipped marker late in the day.
- `daily-{news-}monitor.yml`: open an operational alert when publication is still missing.
- `pages.yml`: build and deploy the static export after trusted changes.
- `ci.yml`: source, data, governance, secret, type, test, and build gates.

## Reading Path
- **Bug fix:** `.cloud.md` -> target module README -> target and adjacent files.
- **Feature:** add the active plan and relevant spec.
- **Architecture/automation:** add this map, ADRs, workflows, and operational prompts.
- **Audit handoff:** add `docs/40-audits/` and the active session log.
