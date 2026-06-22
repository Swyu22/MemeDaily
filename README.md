# MemeDaily

MemeDaily is an internal-facing Chinese internet meme intelligence desk for content,
marketing, and communications teams. It publishes a daily static brief built from
publicly accessible web evidence, with conservative safety gates and permanent archives.

## Current Architecture

- **Collaboration OS:** this repo uses the Ai-Workflow-Kit governance layer. Read
  `AGENTS.md` first, then `.cloud.md`, then the active plan.
- **App layer:** a static web product published with GitHub Pages.
- **Data source:** one JSON file per day under `data/daily/YYYY-MM-DD.json`.
- **Automation model:** GitHub Actions is the live publisher — `daily-publish.yml`
  (`anthropics/claude-code-action` on a Claude subscription token) generates, validates,
  commits, and pushes the daily file on a cloud cron (~07:40 Asia/Shanghai); `daily-catchup`,
  `daily-fallback`, and `daily-monitor` add re-publish / skip / alert resilience. The local
  Codex App run is now an optional manual fallback only.
- **Collection policy:** public web intelligence only. No login cookies, no private
  platform scraping, no media archiving, no comment-text dumps.

## Important Paths

| Path | Purpose |
| --- | --- |
| `.cloud.md` | Current project state and next actions |
| `docs/00-context/PROJECT_MAP.md` | Module map, constraints, and reading path |
| `docs/10-spec/` | Product and data-contract specs |
| `docs/20-plan/current-iteration.md` | Active implementation checklist |
| `docs/30-decisions/` | Architecture decision records |
| `.github/workflows/` | CI + daily publish / catch-up / fallback / monitor automation |
| `ai/prompts/` | Codex/agent run prompts and routines |
| `ai/sessions/` | Session logs and handoff notes |
| `产品方案.md` | Original Chinese product plan |
| `docs/project/` | Claude Design handoff prototype |

## Local Workflow

```bash
git config core.hooksPath .githooks
bash scripts/checks/check-state-fresh.sh
bash scripts/checks/check-file-size.sh --all
```

After the app scaffold is installed, use:

```bash
npm install
npm run validate
npm run build
```

## Publishing Target

The planned production target is GitHub Pages with the custom domain
`memedaily.fun`. On GitHub Free, the repository must remain public for Pages.
Do not store secrets, private company information, media assets, platform cookies,
or unpublished source material in this repo.
