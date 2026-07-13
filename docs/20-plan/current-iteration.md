# Current Iteration

## Iteration Goal
Fix the installed mobile PWA's uncovered top safe area and blurred content bleed-through,
verify the correction under Safari and Chrome PWA contracts, and deploy it to production.

## Scope
- **In:** iOS standalone metadata, viewport safe-area handling, sticky header painting and
  offsets, Chrome manifest/theming, mobile overscroll behavior, and production verification.
- **Out:** unrelated visual redesign, feed/content changes, and native-app packaging.

## Checklist
- [x] Reproduce the failure path from the PWA metadata and sticky-header CSS.
- [x] Extend the viewport into the device safe area and expose the inset to layout CSS.
- [x] Replace the translucent blurred header with an opaque safe-area-covering surface.
- [x] Include the safe-area inset in pre-hydration sticky offsets and PWA launch colors.
- [x] Run static checks, the full gate suite, and simulated notched-mobile scroll acceptance.
- [x] Commit, push, wait for Pages, and verify production metadata and rendering.
- [x] Match the iOS system status region to the `#fafafa` page surface without restoring blur.
- [x] Recheck mobile safe-area pixels and sticky geometry after the status-style adjustment.
- [x] Run the complete gate and deploy the color-matched status region to production.
- [x] Diagnose Chrome's remaining path as manifest/browser theming plus root overscroll behavior.
- [x] Add a fixed safe-area compositor guard and disable vertical root overscroll.
- [x] Version the Chrome manifest URL and installed-shell cache while preserving app identity.
- [x] Verify the Chrome contract under dark system preference and a forced 47px inset.
- [x] Run the complete gate and deploy the Chrome-specific follow-up.

## High-Risk Areas
- iOS Home Screen mode calculates viewport and safe-area geometry differently from a normal
  mobile browser tab.
- Sticky offsets must remain correct before and after `HomeTabs` measures the real header.
- An installed service worker must discover the new static HTML and hashed stylesheet.
- Chrome can retain install metadata independently of normal document and Service Worker caches.

## Acceptance Standard
- Generated HTML contains `viewport-fit=cover` and the light `default` standalone status-bar
  metadata, with page, header, theme, and launch surfaces all set to `#fafafa`.
- A simulated 47px top inset remains fully painted by the opaque header before and after scroll.
- The mobile tab strip pins immediately below the complete header, including the safe area.
- Chrome receives one generic capable meta, a versioned manifest with stable app `id`, a forced
  light color scheme, disabled root overscroll, and a fixed `#fafafa` safe-area guard.
- `npm run check` passes, Pages deploys the commit, and production serves the new metadata/assets.

## Last Updated
- 2026-07-13 22:49 +0800
