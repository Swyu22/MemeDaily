# Current Iteration

## Iteration Goal
Complete a full installed-Skills engineering audit across every important project file, repair
confirmed defects with minimal changes, and close the loop with reproducible local, CI, Pages,
browser, and production evidence.

## Scope
- **In:** application/domain/feature source, both feed contracts and data, workflows, scripts,
  hooks, configuration, prompts, documentation, PWA assets, tests, governance records, and
  deployment verification.
- **Out:** historical generated prototype rewrites, unrelated product redesign, speculative
  dependency upgrades, and external account/credential administration.

## Checklist
- [x] P0 Inventory installed Skills, deduplicate aliases, and select applicable Skills.
- [x] P0 Scan and read all important source, configuration, data, workflow, script, asset,
  prompt, and documentation types.
- [x] P0 Run baseline build/test/governance/security/supply-chain checks and inspect live runs.
- [x] P0 Repair confirmed publishing, monitoring, data-contract, and latest-run state defects.
- [x] P1 Repair accessibility feedback, fallback-label drift, complexity drift, and canonical docs.
- [x] P0 Run full local gates plus focused regression, browser, accessibility, and performance checks.
- [x] P0 Push, pass CI, deploy Pages, and verify the production generation.
- [x] P1 Publish the complete audit and itemized acceptance report.
- [ ] P1 USER: confirm iOS Chrome dark-mode installed-PWA status area on a physical device.

## High-Risk Areas
- Both daily writers can race and rebase after their first validation; final pushed trees must be
  reinstalled and revalidated after rebase.
- Feed status UI must describe the latest run, including `skipped` and `held`, rather than silently
  substituting the latest visible successful day.
- Workflow monitors for two feeds share one issue tracker and must use feed-specific issue titles.
- The installed iOS status area remains partly browser-owned and cannot be fully accepted in
  desktop emulation.

## Acceptance Standard
- Every finding is tied to a concrete file, Skill/standard, repair decision, and acceptance method.
- `npm run check` and all strict project governance/security checks pass from a clean tree.
- Focused tests prove post-rebase validation, monitor isolation, source-outlet enforcement,
  latest-run UI state, clipboard feedback, and PWA surface behavior.
- Desktop/mobile light/dark browser checks show no console errors, overflow, broken routes, or
  inaccessible primary interactions; performance evidence is recorded.
- CI and Pages succeed for the exact accepted commit, and production serves the same generation.

## Last Updated
- 2026-07-14 15:17 +0800
