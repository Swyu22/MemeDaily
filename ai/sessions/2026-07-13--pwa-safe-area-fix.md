# Session: Mobile PWA Safe-Area Fix

## Goal
Fix the empty top region and blurred scrolling-content bleed-through seen when MemeDaily is
opened as an installed mobile PWA, then verify and deploy the correction.

## Diagnosis
- `src/app/layout.tsx` used the default iOS standalone status-bar mode and did not emit
  `viewport-fit=cover`, so the application did not own and lay out the full top safe area.
- `.topbar` used a translucent background plus `backdrop-filter: blur(12px)`, which made
  scrolling feed content intentionally visible as a blurred layer beneath the sticky header.
- Pre-hydration sticky offsets contained only the header's content height and omitted any
  device safe-area inset.
- The manifest launch background was brand yellow rather than the application/header surface.

## Changes
- Request a cover viewport and `black-translucent` iOS standalone status-bar presentation.
- Define `--safe-area-top`, paint `html`, `body`, `.shell`, and `.topbar` consistently, and
  include the inset in the topbar and sticky-offset fallbacks.
- Make the topbar opaque and remove its backdrop blur.
- Align the manifest launch background with the application surface.

## Verification
- Generated HTML emits `viewport-fit=cover`, `theme-color=#fafafa`, and
  `apple-mobile-web-app-status-bar-style=black-translucent`.
- `npm run check` passes both data validators, lint, typecheck, 80 tests, and a 124-page build.
- Playwright at 390x844 with a forced 47px inset passed at `scrollY=0` and `scrollY=1200`: the
  opaque header stayed at top 0 with height 133px, the tab strip pinned at 133px, and all 18,330
  pixels in the simulated top safe area remained exactly `#fafafa`.
- A border-box `ResizeObserver` test confirmed delayed safe-area changes update `--header-h`.
- PR #20 passed both governance checks and merged as `9e2350a`. Pages run `29256033620` built and
  deployed successfully.
- Production returned 200 for `/`, `/archive/`, and `/sw.js`; its HTML/manifest exposed the new
  viewport, status-bar, theme, and launch-background values.
- Production repeated the forced-inset scroll/geometry/pixel acceptance with zero hard request
  failures and zero safe-area pixel contamination.

## Outcome
The repository, `origin/main`, and GitHub Pages production contain the safe-area fix. The sticky
header is now an opaque surface that covers the full PWA top inset, and downstream sticky UI tracks
late WebKit geometry changes without overlap.

## Follow-up: Status Surface Color
- The user requested that the former transparent top region visually match the page background.
- Changed the iOS standalone status-bar style from `black-translucent` to `default`, removing the
  system's dark translucent overlay while retaining `viewport-fit=cover` and safe-area padding.
- Generated metadata now combines `status-bar-style=default` with `theme-color=#fafafa`; manifest,
  HTML, body, shell, and sticky header surfaces already use the same color.
- A 390x844 mobile check with a forced 47px inset and `scrollY=1200` found zero mismatched top
  pixels, no backdrop blur, and exact 133px header/tab-strip alignment.
- `npm run check` passes both validators, lint, typecheck, 80 tests, and a 124-page build.
- PR #22 merged as `295e0d0`; Pages run `29258153928` built and deployed successfully.
- Production exposes `status-bar-style=default`, `theme-color=#fafafa`, matching manifest colors,
  and passed the same safe-area color/scroll acceptance with zero mismatched pixels.

## Follow-up: Chrome PWA
- Safari physical-device behavior is corrected; the user reports that Chrome still exposes blurred
  scrolling content in the top region.
- Chrome already received matching document and manifest theme colors, so the remaining path is
  root overscroll/rubber-banding plus aggressively cached installed-app metadata.
- Disabled vertical overscroll on both root scroll elements and added a fixed `#fafafa` safe-area
  compositor guard above the sticky header.
- Added `color-scheme=light`, a versioned manifest URL, and a stable manifest `id`; bumped the
  Service Worker generation to `memedaily-v3` so installed clients replace the old shell caches.
- Chromium mobile acceptance used a dark system preference, forced a 47px inset, and scrolled to
  1200px. It confirmed one generic capable meta, the new manifest/SW contract, overscroll `none`,
  a fixed 47px guard, no blur, exact 133px sticky alignment, and zero mismatched top pixels.
- `npm run check` passes both validators, lint, typecheck, 80 tests, and a 124-page build.
- PR #24 merged as `f9ce590`; Pages run `29259440314` built and deployed successfully.
- Production Chromium acceptance repeated every local assertion with 200 manifest/SW responses,
  zero top pixel mismatch, and no hard first-party request failures.

## Follow-up: Physical Chrome Containment Correction
- A physical Chrome retest still showed blurred content crossing the system status region, proving
  that the simulated 47px inset and fixed guard did not model Chrome's installed-shell composition.
- The remaining root cause is `viewport-fit=cover`: it explicitly lets the document extend into
  the unsafe region, while Chrome can report a zero CSS inset there. A zero-height guard cannot
  paint an operating-system-owned region.
- Switched the viewport contract to `contain`, so the browser reserves the unsafe region instead
  of allowing page content below it. Removed `--safe-area-top`, topbar inset padding, and the fixed
  pseudo-element guard; the ordinary document and sticky header remain opaque `#fafafa`.
- Retained root `overscroll-behavior-y: none`, light color-scheme and theme metadata, and the stable
  manifest identity. Versioned the manifest URL as `20260713-2` and bumped caches to
  `memedaily-v4` to force installed-shell metadata/assets forward.
- The static build emits `viewport-fit=contain`, `theme-color=#fafafa`, `color-scheme=light`, and
  the new manifest URL. Chromium at 390x844 under dark system preference confirms 200 manifest/SW
  responses, opaque root/body/header surfaces, no blur or CSS safe-area overlay, disabled root
  overscroll, and exact 86px tab/header alignment once sticky.
- A device-scale-2 screenshot scan found zero non-`#fafafa` pixels in the unobstructed top eight
  CSS pixels after scrolling. `npm run check` passes both validators, lint, typecheck, 80 tests,
  and the 124-page static build.

## July 13 Item-Count Investigation
- The primary meme workflow succeeded and committed three visible records at 07:37:36 +0800 in
  `ecbc3a5` (`chore(data): publish MemeDaily 2026-07-13`). `谢停风` was initially
  `published:true`.
- The full Skills audit later added a deterministic disaster/public-safety backstop. Commit
  `e45be31` at 20:24:50 +0800, merged through PR #17, changed the envelope from `published` to
  `partial`, the visible count from three to two, and `谢停风` to `published:false`.
- Its text repeatedly uses `台风` and `防灾`, both explicit high-signal terms in
  `src/domain/memedaily/rules.ts`. The public loader intentionally filters out records whose
  `published` flag is false.
- The JSON record and its sources were not deleted. Restoring it would require an explicit product
  policy exception plus tests; simply flipping the flag would bypass the current safety contract.

## Production Deployment
- PR #26 passed both governance jobs and merged to `main` as `aa1df95`. CI run `29262548831` and
  Pages run `29262548127` completed successfully.
- Production HTML now emits `viewport-fit=contain`, `theme-color=#fafafa`,
  `color-scheme=light`, and manifest URL `20260713-2`; the manifest and Service Worker return 200
  with stable app `id`, matching `#fafafa` colors, and cache generation `memedaily-v4`.
- Production Chromium at 390x844 under dark system preference passed opaque-surface, no-blur,
  disabled-overscroll, no-synthetic-guard, 86px sticky-alignment, and top-pixel checks with no
  hard first-party failures.
- The same acceptance found exactly two cards in the July 13 section and no visible `谢停风` text;
  its unpublished detail route returns 404 as required by the current public selector.

## Residual Manual Check
- A physical installed PWA is the final authority for iOS system status-bar composition. Chrome
  can retain install metadata outside normal web caches, so remove the existing icon, open the
  deployed site in Chrome, add it again, and confirm the top region remains solid while scrolling.
