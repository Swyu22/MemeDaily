/*
 * MemeDaily service worker — served at /MemeDaily/sw.js, scope /MemeDaily/.
 *
 * GOAL: every ONLINE open shows fresh + fully-styled content with no manual reload,
 * while making "stale-forever" structurally impossible.
 *
 * STRATEGY (per request type):
 *  - NAVIGATIONS (HTML documents): NETWORK-FIRST. We always hit the network first so an
 *    online user can never be pinned on yesterday's HTML. Cache is a same-day fallback
 *    used ONLY when the network actually fails (offline / flaky). Because fresh HTML
 *    carries the CURRENT content-hashed asset URLs, this single rule fixes BOTH symptoms
 *    (stale memes AND missing CSS from a purged old hash).
 *  - IMMUTABLE HASHED ASSETS (/MemeDaily/_next/static/...): CACHE-FIRST. Content-hashed,
 *    so cache-first is safe forever and kills the wasteful 10-min re-fetch. It also
 *    survives the redeploy purge race: a still-referenced old chunk is served from cache
 *    even if the CDN already purged it (network falls back to cache).
 *  - FONTS CSS + font files (/MemeDaily/fonts/...): STALE-WHILE-REVALIDATE. Serve instantly,
 *    refresh in background. fonts.css is NOT content-hashed, so we never cache-first it
 *    forever; SWR keeps it self-healing.
 *  - EVERYTHING ELSE (data JSON via fetch, etc.): pass through to the network untouched.
 *
 * input:  fetch events within scope /MemeDaily/
 * output: Response (network-preferred for HTML; cache-preferred for immutable assets)
 * pos:    public/sw.js -> deployed to out/sw.js at /MemeDaily/sw.js
 */

// Bump this string to force a full cache flush for ALL clients on the next deploy
// (activate deletes every cache whose name does not start with CACHE_VERSION).
// Immutable assets are keyed by their content-hashed URL, so a new build just writes new
// keys; superseded keys are NOT auto-evicted (the Cache API has no TTL) but accumulate
// only slowly — they change when code/CSS hashes change, not on daily content-only
// publishes — and stay tiny. Bump the version if you ever want to reclaim that space.
const CACHE_VERSION = "memedaily-v1";
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const HTML_CACHE = `${CACHE_VERSION}-html`;

// Derived from the SW's OWN registration scope, so detaching/re-attaching the domain (a
// basePath change) needs NO edit here: root domain -> "/", GitHub Pages subpath -> "/MemeDaily/".
const SCOPE_PATH = new URL(self.registration.scope).pathname;
const STATIC_PREFIX = `${SCOPE_PATH}_next/static/`;
const FONTS_PREFIX = `${SCOPE_PATH}fonts/`;

self.addEventListener("install", () => {
  // Take over as soon as possible; we rely on network-first for HTML so there is no
  // risk of skipWaiting serving stale content — the new SW still goes to network first.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop any cache not belonging to the current version (old SW generations).
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// Allow the page to ask the waiting/installed SW to activate immediately (used after we
// detect a new SW on a fresh page load). Keeps update latency to a single navigation.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isHtmlNavigation(request) {
  if (request.mode === "navigate") return true;
  const accept = request.headers.get("accept") || "";
  return request.method === "GET" && accept.includes("text/html");
}

// Normalize the inline rescue's cache-buster (?_r=ts) out of the HTML cache key, so those
// rescue navigations don't bloat the cache or get served back stale under a one-off URL.
function htmlKey(request) {
  const u = new URL(request.url);
  u.searchParams.delete("_r");
  return u.toString();
}

// NETWORK-FIRST for navigations. Never returns stale HTML to an online user.
async function handleNavigation(request) {
  const cache = await caches.open(HTML_CACHE);
  try {
    // No-store at the SW boundary so we always revalidate the document against origin;
    // the CDN's max-age=600 cannot pin us because we explicitly bypass the HTTP cache.
    const fresh = await fetch(request, { cache: "no-store" });
    if (fresh && fresh.ok && fresh.type === "basic") {
      cache.put(htmlKey(request), fresh.clone()); // same-day offline fallback (rescue ?_r normalized out)
    }
    return fresh;
  } catch (err) {
    // Network genuinely failed (offline). Fall back to last good HTML if we have it,
    // else let the browser show its normal offline error.
    const cached = await cache.match(htmlKey(request));
    if (cached) return cached;
    // No homepage (SCOPE_PATH) fallback: serving the homepage HTML under a different
    // deep-link URL is confusing. Let the browser show its native offline page instead.
    throw err;
  }
}

// CACHE-FIRST for immutable, content-hashed assets.
async function handleImmutableAsset(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok && fresh.type === "basic") {
      cache.put(request, fresh.clone()); // never cache a 404/opaque (would poison the asset cache)
    }
    return fresh;
  } catch (err) {
    // Last-ditch: maybe it landed in cache via another in-flight request.
    const retry = await cache.match(request);
    if (retry) return retry;
    throw err;
  }
}

// STALE-WHILE-REVALIDATE for fonts (fonts.css is not content-hashed; font files are stable).
async function handleFont(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((fresh) => {
      if (fresh && (fresh.ok || fresh.type === "opaque")) {
        cache.put(request, fresh.clone());
      }
      return fresh;
    })
    .catch(() => undefined);
  return cached || (await network) || fetch(request);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only GET, only same-origin, only within our basePath scope. Everything else
  // (cross-origin, POST, out-of-scope) is left entirely to the browser.
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(SCOPE_PATH)) return;

  // Never intercept the SW file or anything that could create a self-update loop.
  if (url.pathname === `${SCOPE_PATH}sw.js`) return;

  if (isHtmlNavigation(request)) {
    event.respondWith(handleNavigation(request));
    return;
  }
  if (url.pathname.startsWith(STATIC_PREFIX)) {
    event.respondWith(handleImmutableAsset(request));
    return;
  }
  if (url.pathname.startsWith(FONTS_PREFIX)) {
    event.respondWith(handleFont(request));
    return;
  }
  // data JSON and everything else: do not intercept — must always be fresh from network.
});
