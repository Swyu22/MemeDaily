# Current Iteration

## Iteration Goal
- Initialize MemeDaily as a governed static product: Ai-Workflow-Kit state,
  Next.js static scaffold, JSON contract validation, GitHub Pages workflows, and
  Codex App daily automation.

## Scope
- **In:** governance docs, project map, product spec, ADRs, data contract, sample
  daily data, validation scripts, static pages, build workflows, automation prompt.
- **Out:** real daily content collection run, login-based scraping, OpenAI API,
  Supabase, private access control, production DNS changes.

## Checklist
- [x] P0 Import and adapt Ai-Workflow-Kit collaboration OS.
- [x] P0 Initialize git repo and connect `Swyu22/MemeDaily`.
- [x] P0 Create application scaffold and static data loader.
- [x] P0 Implement daily JSON schema validation and evidence gates.
- [x] P0 Build Today, Archive/Search, and Meme detail pages.
- [x] P0 Add GitHub Pages build workflow.
- [x] P0 Add skipped-day fallback workflow.
- [x] P1 Add Codex daily automation prompt and local app automation.
- [x] P1 Add tests for evidence, safety, meme-shell, and invalid JSON cases.
- [x] P2 Commit and push initial foundation.

## Risks / Dependencies
- GitHub Pages public repo requirement means no sensitive data can enter this repo.
- Local Codex automation depends on the current Mac staying awake and logged in.
- Evidence pages can disappear; the app must preserve compact source metadata without
  copying large excerpts or media.
- GitHub Pages is enabled and deploying; `memedaily.fun` needs Aliyun DNS records
  before HTTPS can be enforced.

## Docs To Update
- [x] `.cloud.md`
- [x] `docs/00-context/PROJECT_MAP.md`
- [x] `docs/20-plan/current-iteration.md`
- [x] `docs/10-spec/memedaily-product-spec.md`
- [x] ADR for static GitHub Pages architecture
- [x] ADR for public-web evidence strategy
- [x] `ai/sessions/2026-06-20--project-kickoff.md`

## Last Updated
- 2026-06-20 16:36 +0800
