"use client";

/*
 * ServiceWorkerManager — registers the network-first SW and closes the two gaps a SW
 * alone cannot: (1) the SW update lifecycle (activate the new SW on the next load,
 * reload once when it takes control so the page uses current assets) and (2) the
 * bfcache restore path, which a service worker does NOT intercept.
 *
 * Mounts once in app/layout.tsx (inside <body>). Renders nothing.
 *
 * input:  none (runs on mount in the browser)
 * output: registered SW + a one-time controlled reload on update + bfcache freshness guard
 * pos:    src/app/ServiceWorkerManager.tsx -> mounted by src/app/layout.tsx
 */

import { useEffect } from "react";

// basePath-derived; "" on root domain, "/MemeDaily" on the github.io subpath.
const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SW_URL = `${BP}/sw.js`;
const SW_SCOPE = `${BP}/`;

export default function ServiceWorkerManager() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let reloadedForUpdate = false;

    // When a newly-installed SW takes control (after SKIP_WAITING), reload ONCE so the
    // page is driven by the current SW and references current assets. Guard prevents loops.
    const onControllerChange = () => {
      if (reloadedForUpdate) return;
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

        // Proactively check for a SW update on every load (cheap; sw.js is max-age=600).
        reg.update().catch(() => {});
      } catch {
        // Registration failure must never break the page; network-first means the site
        // works fine with no SW at all (just without the asset-cache optimization).
      }
    };

    register();

    // --- bfcache / restored-from-history guard (the path the SW cannot see) ---
    // Mobile browsers restore a frozen page from bfcache on back/forward or app-switch
    // reopen. No fetch fires, so the SW never runs. If that restored page is stale
    // (loaded before today's ~07:00 publish), force a fresh load. We use a conservative
    // signal: the document was restored from bfcache (event.persisted) AND the markup is
    // older than the most recent publish boundary we can observe.
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return; // only bfcache restores; normal loads already fresh
      const nav = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      // Time since this document was originally fetched. A bfcache page that has been
      // frozen across a publish boundary is the stale case we must fix.
      const ageMs = nav ? Date.now() - (performance.timeOrigin + nav.responseEnd) : Infinity;
      // 30 min: comfortably longer than the CDN max-age (10 min) yet short enough that a
      // restore after the daily publish reloads. Reload bypasses bfcache and (via the SW)
      // hits the network for fresh HTML + current assets.
      if (ageMs > 30 * 60 * 1000) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return null;
}
