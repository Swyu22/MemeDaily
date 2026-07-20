# AI Session Log - 2026-07-20 -- publish-resilience-hardening

## Session Meta
- Project: MemeDaily
- Device: local Mac workspace
- Model: Claude Code (Opus)
- Task Type: incident response / pipeline hardening
- Tier: feature
- Start Time: 2026-07-20

## Incident (why today's 日报 was not published)
Four failures, three distinct causes, compounding:
1. 06:00 primary: agent ✅ → publish ❌ — agent emitted malformed JSON (SyntaxError pos 2873).
2. 06:47 backup: agent ✅ → publish ❌ — malformed JSON again (pos 2512, different spot).
3. 08:13 catchup: ❌ — `gh workflow run` hit a transient GitHub API HTTP 503 under `bash -e`;
   the ONLY catchup event GitHub fired all morning (07:15/09:15/10:15 schedules were dropped).
4. 11:00 manual dispatch: agent ✅ → publish ❌ — items[2].summary 153 chars > schema cap 150.

Recovery: downloaded run 29713124440's artifact, verified content, applied ONE faithful
abbreviation (中国人民银行→央行, 153→149 chars), stamped via `npm run stamp:publish`,
`npm run check` green, committed as data-only `07e12f5` (ADR-006 supervised recovery). Live.

## Root-cause insight
The ADR-006 confinement (2026-07-14) removed ALL shell from the model job — the agent can no
longer run `npm run validate:news` / `npm run validate` to self-check. The malformed-output surge
(memes 07-15 ×1, news 07-20 ×3) began exactly then: the agent lost its fix-and-re-run loop, and
nothing replaced it. Additionally the catchup dispatch had no retry (one 503 = lost hour) and
GitHub silently drops scheduled events.

## Hardening applied (user-approved)
1. **Catchup dispatch retry** (`daily-catchup.yml` + `daily-news-catchup.yml`): 3-attempt backoff
   retry around `gh workflow run`; the `gh run list` ACTIVE probe also retries ×3 and on persistent
   API failure PROCEEDS to dispatch (safe: the publish workflows have concurrency groups + the
   already-published dedup guard, so a duplicate dispatch queues or no-ops). Availability-biased.
2. **Deterministic fail-fast JSON parse** in both publish workflows' agent job (after the action,
   before artifact upload): `node -e JSON.parse(...)` — no deps, catches the dominant syntax-error
   mode in the cheap job with a crisp ::error; schema gates still run in the trusted publish job.
3. **Self-check ritual for the shell-less agent** (both automation MDs + both inline prompts):
   after EVERY Write/Edit, Read the complete file back and verify syntax balance, field limits,
   and run_report/rank invariants; the LAST action before finishing must be a clean full Read.
4. **Summary headroom** (news MD + inline prompt + CODEX handoff §6.5): target 约100–140字,
   hard cap 150 unchanged in schema — stop the agent writing flush against the limit.

## Adversarial review outcome (4 lenses, refute-verified)
- bash/workflow correctness: PASS (all retry loops verified under `set -euo pipefail`, incl.
  non-numeric ACTIVE handling; fail-fast step conditions/paths/node availability correct).
- security boundary (ADR-006): PASS — allowedTools untouched, fail-fast step not model-invocable
  and token-free, catchup permissions unchanged.
- races/duplicate spend: 1 CONFIRMED major — the proceed-after-failed-probe path could queue a
  duplicate publish pinned to the PRE-publish SHA; the dedup guard read only the stale worktree,
  so the agent would re-run (~$5) and the duplicate publish would die red on an add/add rebase.
  FIXED at the root: both publish guards now read today's envelope from the live `origin/main`
  tip (anonymous `git fetch --depth=1` ×3 retries, `git show FETCH_HEAD:` status check, worktree
  fallback on persistent network failure). A queued duplicate now genuinely no-ops — this also
  closes the pre-existing manual-dispatch duplicate hole.
- prompt consistency: 3 nits fixed — dailynews schema.ts summary comment now says 100–140 target
  (the agent reads schema.ts every run); memes self-check now includes the ≥1
  platform_public/aggregator tier requirement; memes MD turn budget aligned to the real
  --max-turns 60. ADR-006 amended to record the shell-less-resilience additions.

## Verification
- YAML validity for all 4 edited workflows; `npm run check` green (94 tests / 151 pages).
- `set -euo pipefail` local simulations: catchup retry loops (4/4 scenarios) and the new
  live-tip guard (fetch-success/published, fetch-fail→worktree fallback) behave as designed.
- Adversarial review workflow (5 agents) over the staged diff before push; the confirmed
  finding was fixed and re-verified rather than shipped.

## Next Actions
- Observe the next scheduled writers under the new self-check prompts + fail-fast step.
- USER P0 unchanged: rotate the exposed Aliyun AccessKey.
