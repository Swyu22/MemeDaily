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
- Production deployment is pending.

## Residual Manual Check
- A physical installed PWA is the final authority for iOS system status-bar composition. Reopen
  the app after deployment (or remove/re-add it if iOS retains old metadata) and confirm the top
  region remains solid while scrolling.
