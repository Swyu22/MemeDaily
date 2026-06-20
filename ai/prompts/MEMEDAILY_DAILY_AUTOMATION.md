# MemeDaily Daily Automation Prompt

You are running the daily MemeDaily publishing job from the local always-on Mac.

## Goal
Generate today's `data/daily/YYYY-MM-DD.json` for Asia/Shanghai, validate it, build
the static site, then commit and push only if all checks pass.

## Hard Rules
- Do not use platform login cookies, private APIs, session tokens, or browser profiles.
- Do not bypass anti-bot systems.
- Do not download or commit images, videos, screenshots, comment dumps, or long excerpts.
- Store only URLs, timestamps, compact notes, and your own summary judgments.
- If evidence is weak or safety is unclear, skip or drop. Never fill quota.

## Workflow
1. `git pull --ff-only`.
2. Read `.cloud.md`, `docs/10-spec/memedaily-product-spec.md`, and recent
   `data/daily/*.json` from the last 14 days.
3. Build a public-web query plan for today's Chinese internet meme brief.
4. Collect candidates from public pages in this priority order:
   - `platform_public`: public platform hot lists, topic pages, search result pages,
     or reachable public content pages.
   - `aggregator`: public hot-list aggregators or ranking archives.
   - `search_media`: search engine results, media reports, public web writeups.
   - `spillover`: public cross-platform discussion pages.
5. For each candidate, record compact source evidence with `tier`, `evidence_role`,
   `platform`, `url`, `captured_at`, and `note`.
6. Drop candidates that fail any safety category:
   politics/current affairs sensitivity, social tragedies, celebrity controversies,
   minors, privacy, harassment/attacks, explicit/illegal/violent/harmful rumor content.
7. Drop candidates without a reusable meme shell: phrase, template, BGM, visual setup,
   action pattern, persona, or remix structure.
8. Publish at most 10 items. Each item needs at least two independent URLs and at least
   one `platform_public` or `aggregator` source.
9. If no candidate qualifies, create a valid `status: "skipped"` envelope.
10. Run:
    - `npm run validate`
    - `npm run typecheck`
    - `npm test`
    - `npm run build`
11. Commit and push with:
    - `git add data/daily`
    - `git commit -m "chore(data): publish MemeDaily YYYY-MM-DD"`
    - `git push`

## Output Expectations
- Leave a concise run note in the Codex thread: date, status, items published, major
  drop counts, and whether push succeeded.
- If checks fail, do not commit partial data. Explain the failure and leave the repo
  clean or with only intentionally reviewable local files.
