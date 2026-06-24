"use client";

/*
 * ServiceWorkerManager — registers the network-first SW and closes the two gaps a SW
 * alone cannot: (1) the SW update lifecycle (promote a new SW and reload ONCE when it takes
 * control on a genuine update, so the page uses current assets) and (2) the bfcache restore
 * path, which a service worker does NOT intercept — installed UNCONDITIONALLY so it still
 * guards browsers that lack service-worker support.
 *
 * Mounts once in app/layout.tsx (inside <body>). Renders nothing.
 *
 * input:  none (runs on mount in the browser)
 * output: registered SW (where supported) + a one-time controlled reload on update + bfcache guard
 * pos:    src/app/ServiceWorkerManager.tsx -> mounted by src/app/layout.tsx
 */

import { useEffect } from "react";

// basePath-derived; "" on root domain, "/MemeDaily" on the github.io subpath.
const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SW_URL = `${BP}/sw.js`;
const SW_SCOPE = `${BP}/`;

export default function ServiceWorkerManager() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // --- bfcache / restored-from-history guard (the path the SW cannot see) ---
    // Mobile browsers restore a frozen page from bfcache on back/forward or app-switch
    // reopen. No fetch fires, so the SW never runs. This guard depends only on
    // window/performance, so it installs UNCONDITIONALLY — independent of SW support —
    // because it is the only mechanism for the stale-restore case this component exists for.
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return; // only bfcache restores; normal loads are already fresh
      const nav = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      // Time since this document was originally fetched. A bfcache page frozen across a
      // publish boundary is the stale case we must fix.
      const ageMs = nav ? Date.now() - (performance.timeOrigin + nav.responseEnd) : Infinity;
      // 30 min: comfortably longer than the CDN max-age (10 min) yet short enough that a
      // restore after the daily publish reloads. Reload bypasses bfcache and (via the SW)
      // hits the network for fresh HTML + current assets.
      if (ageMs > 30 * 60 * 1000) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", onPageShow);

    // --- service worker registration (only where supported) ---
    let onControllerChange: (() => void) | undefined;
    if ("serviceWorker" in navigator) {
      // Only reload on a genuine UPDATE: if a controller already existed when this page
      // loaded, a later controllerchange means a new SW took over -> reload so the page uses
      // current assets. On the first-ever visit there is no controller and clients.claim()
      // fires controllerchange on initial install — reloading then would be gratuitous.
      const hadController = !!navigator.serviceWorker.controller;
      let reloadedForUpdate = false;
      onControllerChange = () => {
        if (reloadedForUpdate || !hadController) return;
        reloadedForUpdate = true;
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

      const register = async () => {
        try {
          const reg = await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE });

          // If an update is already waiting at load time, promote it immediately.
          if (reg.waiting && navigator.serviceWorker.controller) {
            reg.waiting.postMessage("SKIP_WAITING");
          }

          // A new SW found during this session: once installed, promote it.
          reg.addEventListener("updatefound", () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.addEventListener("statechange", () => {
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                installing.postMessage("SKIP_WAITING");
              }
            });
          });

          // Proactively check for a SW update on every load. The top-level sw.js is fetched
          // bypassing the HTTP cache (updateViaCache default 'imports'), so max-age=600 does
          // not delay update detection — this check is cheap.
          reg.update().catch(() => {});
        } catch {
          // Registration failure must never break the page; network-first means the site
          // works fine with no SW at all (just without the asset-cache optimization).
        }
      };

      register();
    }

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      if (onControllerChange) {
        navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      }
    };
  }, []);

  return null;
}
