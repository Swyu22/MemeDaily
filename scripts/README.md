# Scripts Module

Trusted local/CI utilities. Scripts may import domain contracts but must not import React or
route components.

| File | Responsibility |
| --- | --- |
| `validate-data.ts` | Validate every meme envelope, cross-day lifecycle, and dynamic selection policy |
| `validate-news.ts` | Validate every news envelope and editorial policy |
| `stamp-publish-time.ts` | Apply trusted acceptance time and reject future source captures |
| `stamp-publish-time.test.ts` | Regression coverage for both feed timestamp contracts |
| `daily-publish-gate.ts` | Require completion and historical evaluation clocks, classify live/migration states, and bound repairs |
| `daily-publish-gate.test.ts` | Regression coverage for completion, migration, incident, and visible-prefix repair semantics |
| `historical-backfill.test.ts` | Historical create-only publisher and split evaluation/publication-clock regressions |
| `pwa-surface.test.ts` | Installed-app light surface and opaque top-chrome regression contract |
| `accessibility-contract.test.ts` | Clipboard announcement and search-affordance accessibility regressions |
| `web-performance.test.ts` | Prevent eager prefetch of the large archive route |
| `checks/checks.test.ts` | Adversarial staged-index bypass regression suite |
| `workflow-security.test.ts` | Static workflow token/tool/SHA/deploy security contract |
| `publish-reliability.test.ts` | Pages retry, live-tip fallback, and deploy-freshness regressions |
| `create-skipped-day.ts` | Legacy-named fail-closed guard: only a current-policy editorially complete meme target no-ops |
| `create-skipped-news-day.ts` | Legacy-named fail-closed guard: only a current-policy editorially complete news target no-ops |
| `fallback-target.ts` | Validate fallback dates and contain generated JSON paths |
| `fallback-data-integrity.test.ts` | Empty-news, policy/completion, and fallback date/path regression coverage |
| `prefetch-hotlists.sh` | Fetch public hot-list context for cloud research jobs |
| `fetch-fonts.sh` | Regenerate same-origin font assets; run locally, never in production |
| `compact_font_css.py` | Merge duplicate variable-font weight faces into compact ranges |
| `dispatch-pages.sh` | Adopt the correlated push Pages run or dispatch one recovery, then await success |
| `push-main-with-deploy-key.sh` | Push trusted HEAD through the protected-main deploy-key bypass |
| `print-state.sh` | Print the current file-backed project state |
| `checks/` | Shared git-hook and CI governance/security checks |

`checks/` contains file-size, key-header, state freshness, secret scanning, import boundary,
tier suggestion, and close-reminder scripts. CI and hooks must call the same implementations.
