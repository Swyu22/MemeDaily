# Current Iteration

## Iteration Goal
Fix the installed mobile PWA's uncovered top safe area and blurred content bleed-through,
verify the correction under a simulated notched viewport, and deploy it to production.

## Scope
- **In:** iOS standalone metadata, viewport safe-area handling, sticky header painting and
  offsets, PWA launch colors, mobile scroll behavior, and production verification.
- **Out:** unrelated visual redesign, feed/content changes, and native-app packaging.

## Checklist
- [x] Reproduce the failure path from the PWA metadata and sticky-header CSS.
- [x] Extend the viewport into the device safe area and expose the inset to layout CSS.
- [x] Replace the translucent blurred header with an opaque safe-area-covering surface.
- [x] Include the safe-area inset in pre-hydration sticky offsets and PWA launch colors.
- [x] Run static checks, the full gate suite, and simulated notched-mobile scroll acceptance.
- [ ] Commit, push, wait for Pages, and verify production metadata and rendering.

## High-Risk Areas
- iOS Home Screen mode calculates viewport and safe-area geometry differently from a normal
  mobile browser tab.
- Sticky offsets must remain correct before and after `HomeTabs` measures the real header.
- An installed service worker must discover the new static HTML and hashed stylesheet.

## Acceptance Standard
- Generated HTML contains `viewport-fit=cover` and `black-translucent` standalone status-bar
  metadata.
- A simulated 47px top inset remains fully painted by the opaque header before and after scroll.
- The mobile tab strip pins immediately below the complete header, including the safe area.
- `npm run check` passes, Pages deploys the commit, and production serves the new metadata/assets.

## Last Updated
- 2026-07-13 21:58 +0800
