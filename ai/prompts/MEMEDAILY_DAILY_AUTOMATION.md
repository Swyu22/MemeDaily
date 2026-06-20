# MemeDaily Daily Automation Prompt

You are running the daily MemeDaily publishing job from the local always-on Mac.

## Goal
Generate today's `data/daily/YYYY-MM-DD.json` for Asia/Shanghai, validate it, build
the static site, then commit and push only if all checks pass. The daily publishing
target is 10 interesting, reusable meme items.

## Hard Rules
- Do not use platform login cookies, private APIs, session tokens, or browser profiles.
- Do not bypass anti-bot systems.
- Do not download or commit images, videos, screenshots, comment dumps, or long excerpts.
- Store only URLs, timestamps, compact notes, and your own summary judgments.
- If evidence is weak or safety is unclear, skip or drop. Do not fabricate evidence.

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
5. Always query multiple public aggregator surfaces before deciding the day is thin:
   - rebang.today tabs for Weibo, Xiaohongshu, Douyin, Bilibili, Zhihu, Baidu.
   - tophub.today platform lists and category pages when reachable.
   - hot.cnxiaobai.com, easynews.com.cn, yunge.in, weibo-trending-hot-history,
     weibotop.cn, and weibo.zhaoyizhe.com.
   - Search-engine queries combining platform + 热榜/热搜/热梗/出圈/二创/好笑/模板.
6. For each candidate, record compact source evidence with `tier`, `evidence_role`,
   `platform`, `url`, `captured_at`, and `note`.
7. Drop candidates that fail any safety category:
   politics/current affairs sensitivity, social tragedies, celebrity controversies,
   minors, privacy, harassment/attacks, explicit/illegal/violent/harmful rumor content.
8. Drop candidates without a reusable meme shell: phrase, template, BGM, visual setup,
   action pattern, persona, or remix structure.
9. Publish 10 items whenever 10 candidates pass evidence and safety gates. Favor funny,
   remixable, visually expressive, or sentence-template items over pure hard news.
   Each item needs at least two independent URLs and at least one `platform_public` or
   `aggregator` source.
   Avoid topics framed around a single brand, product launch, company dispute, or
   marketing claim unless the meme shell has clearly generalized beyond that brand.
10. If fewer than 10 candidates pass after the expanded source search, publish only the
    qualified items and record why the day is short in `run_report`; if no candidate
    qualifies, create a valid `status: "skipped"` envelope.
11. Run:
    - `npm run validate`
    - `npm run typecheck`
    - `npm test`
    - `npm run build`
12. Commit and push with:
    - `git add data/daily`
    - `git commit -m "chore(data): publish MemeDaily YYYY-MM-DD"`
    - `git push`

## Output Expectations
- Leave a concise run note in the Codex thread: date, status, items published, major
  drop counts, and whether push succeeded.
- If checks fail, do not commit partial data. Explain the failure and leave the repo
  clean or with only intentionally reviewable local files.
