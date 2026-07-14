# MemeDaily / 热梗日报

A Chinese-internet daily desk for content, marketing, and communications teams. It publishes
a daily static site built from publicly accessible web evidence, with conservative safety
gates and permanent archives. The site has **two feeds**, switchable via the home tabs:

- **热梗 (memes)** — genuinely spreading, reusable 网络流行语 / 语言梗 (curated for content &
  advertising value). Data: `data/daily/YYYY-MM-DD.json`.
- **日报 (news)** — up to 10 heat-ranked 民生 news items a day (close to everyday life,
  restrained news tone). Data: `data/daily-news/YYYY-MM-DD.json`.

## Current Architecture

- **Collaboration OS:** this repo uses the Ai-Workflow-Kit governance layer. Read
  `AGENTS.md` first, then `.cloud.md`, then the active plan.
- **App layer:** a static web product (Next.js static export) published with GitHub Pages.
  One JSON file per day per feed under `data/daily/` (memes) and `data/daily-news/` (news).
- **Automation model:** GitHub Actions is the live publisher. Two confined two-job pipelines -
  `daily-publish.yml` (memes, ~07:00 Asia/Shanghai) and `daily-news-publish.yml` (news,
  ~06:00) — each runs `anthropics/claude-code-action` (SHA-pinned, on a Claude subscription
  token) in an **exact-path `agent` job** that may write only the day's JSON artifact and
  cannot run shell commands. A
  separate **`publish` job** checks out trusted repo code, validates, commits locally, rebases
  without a write token, then reinstalls and revalidates the final tree. Only the last push/Pages
  step receives the write token. The reliable primary trigger for each is an external cron-job.org job (the GitHub
  cron is a backup); `daily-{news-}catchup` / `fallback` / `monitor` add re-publish / skip /
  alert resilience. A local Codex run is a supervised recovery path because prompts are not
  an OS sandbox; see `ai/prompts/CODEX_FULL_HANDOFF.md`.
- **Client freshness:** an inline boot script in `layout.tsx` `<head>` (chunk-independent,
  runs even if hashed JS 404s) self-heals an unstyled render and registers a hand-written
  **network-first** service worker (`public/sw.js`: browser-cache bypass for HTML, offline
  fallback, immutable hashed assets cached). GitHub Pages may still retain HTML at its edge
  for its hosting TTL. The app CSS is **inlined** into each page's `<head>`
  (`experimental.inlineCss`), so it ships with the HTML and can't independently fail to load.
  `sw.js` **derives** its scope/prefixes from `self.registration.scope`, so a domain
  detach/re-attach (a `basePath` change) needs NO `sw.js` edit.
- **Collection policy:** public web intelligence only. No login cookies, no private platform
  scraping, no media archiving, no comment-text dumps. No paid model API in the product itself.

## Important Paths

| Path | Purpose |
| --- | --- |
| `.cloud.md` | Current project state and next actions (SSOT — read first) |
| `AGENTS.md` | Cross-model canon (reading order, rules, tool adaptation) |
| `ai/prompts/CODEX_FULL_HANDOFF.md` | Self-contained prompt for Codex to take over both feeds |
| `ai/prompts/MEMEDAILY_DAILY_AUTOMATION.md` / `DAILYNEWS_DAILY_AUTOMATION.md` | Living per-feed rules |
| `src/domain/{memedaily,dailynews}/schema.ts` | Zod data contracts |
| `docs/00-context/PROJECT_MAP.md` | Module map, constraints, reading path |
| `docs/30-decisions/` | Architecture decision records |
| `docs/40-audits/` | Dated engineering audits and installed-Skills inventories |
| `scripts/stamp-publish-time.ts` | Trusted post-agent publication timestamp normalization |
| `.github/workflows/` | CI + per-feed publish / catch-up / fallback / monitor automation |
| `产品方案.md` | Original Chinese product plan (memes feed) |

## Local Workflow

```bash
git config core.hooksPath .githooks
npm install
npm run check   # validate + validate:news + lint + typecheck + test + build
```

To validate an agent-produced day file in a trusted local recovery run, stamp it before
the full check:

```bash
npm run stamp:publish -- data/daily/YYYY-MM-DD.json
npm run check
```

## Publishing Target

The site is **live at `https://memedaily.fun`** (custom domain re-attached 2026-06-29 after
ICP 备案 approval; `next.config.mjs` basePath `""`). To detach again if ever needed, flip
basePath to `"/MemeDaily"`, point `layout.tsx` metadata back at the github.io origin, remove
`public/CNAME`, and disable the DNS records — `sw.js` self-derives, so it needs no edit (see
the re-attach runbook in `.cloud.md`). On GitHub Free the repository must remain public for
Pages. Do not store secrets, private company information, media assets, platform cookies, or
unpublished source material in this repo.
