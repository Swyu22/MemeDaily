# Scripts Module

Trusted local/CI utilities. Scripts may import domain contracts but must not import React or
route components.

| File | Responsibility |
| --- | --- |
| `validate-data.ts` | Validate every meme envelope and cross-day policy |
| `validate-news.ts` | Validate every news envelope and editorial policy |
| `stamp-publish-time.ts` | Apply trusted acceptance time and reject future source captures |
| `stamp-publish-time.test.ts` | Regression coverage for both feed timestamp contracts |
| `pwa-surface.test.ts` | Installed-app light surface and opaque top-chrome regression contract |
| `accessibility-contract.test.ts` | Clipboard announcement and search-affordance accessibility regressions |
| `web-performance.test.ts` | Prevent eager prefetch of the large archive route |
| `checks/checks.test.ts` | Adversarial staged-index bypass regression suite |
| `workflow-security.test.ts` | Static workflow token/tool/SHA/deploy security contract |
| `create-skipped-day.ts` | Produce a valid skipped meme envelope |
| `create-skipped-news-day.ts` | Produce a valid skipped news envelope |
| `prefetch-hotlists.sh` | Fetch public hot-list context for cloud research jobs |
| `fetch-fonts.sh` | Regenerate same-origin font assets; run locally, never in production |
| `compact_font_css.py` | Merge duplicate variable-font weight faces into compact ranges |
| `dispatch-pages.sh` | Correlate and await a successful Pages run after bot-authored pushes |
| `print-state.sh` | Print the current file-backed project state |
| `checks/` | Shared git-hook and CI governance/security checks |

`checks/` contains file-size, key-header, state freshness, secret scanning, import boundary,
tier suggestion, and close-reminder scripts. CI and hooks must call the same implementations.
