# Current Iteration

## Iteration Goal
Remove the gray translucent top region seen in the installed iOS Chrome PWA under dark mode,
while keeping the current non-immersive status-bar layout and an opaque page-colored surface.

## Scope
- **In:** root viewport metadata, critical first-paint CSS, global shell/topbar styles,
  manifest launch colors, offline shell, service-worker generation, regression tests,
  state records, and production verification.
- **Out:** content feeds, publishing jobs, immersive `viewport-fit=cover`, safe-area layout
  changes, unrelated visual redesign, and external account configuration.

## Checklist
- [x] P0 Confirm manifest, root canvas, and transparent topbar conflicts at the rollback SHA.
- [x] P0 Lock document/app chrome to one light color without enabling an overlay status bar.
- [x] P0 Make the sticky topbar opaque and remove its backdrop blur.
- [x] P1 Align manifest, offline fallback, and service-worker cache generation.
- [x] P1 Add focused installed-PWA surface regression coverage.
- [x] P0 Run full lint, type, test, build, governance, and emitted-output assertions.
- [x] P0 Commit, push, await Pages, and verify the production HTML/manifest/SW/CSS.
- [ ] P1 Confirm the remaining physical-device behavior after Chrome refresh/reinstall.

## High-Risk Areas
- iOS installed-app chrome may use manifest, document metadata, root paint, or cached shell
  state at different lifecycle stages.
- `black-translucent` or `viewport-fit=cover` would move content under the status bar and
  recreate the visible scroll-through failure.
- A stale service worker or cached manifest can conceal a correct source change until the
  installed app refreshes its shell metadata.

## Acceptance Standard
- Both light and dark preference metadata resolve to `#fafafa` with `only light` declared.
- Root elements and sticky topbar remain opaque; no topbar `rgba()` or blur survives.
- Manifest and offline shell use the same background, and the service-worker cache generation
  changes so an installed app cannot remain pinned to the old shell.
- `npm run check` passes and the emitted static HTML contains the expected metadata and
  critical style before the boot script.
- GitHub Pages serves the new HTML, manifest, worker, and hashed CSS over HTTPS.

## Last Updated
- 2026-07-14 02:28 +0800
