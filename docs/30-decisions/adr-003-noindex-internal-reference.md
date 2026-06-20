# ADR-003: Keep MemeDaily Search-Engine De-indexed (noindex)

## Status
Accepted

## Context
MemeDaily is hosted on the public web (GitHub Pages, custom domain `memedaily.fun`) but is
an internally-oriented reference desk for the team. Its content is curated from other
people's public posts with light original commentary plus source links. Two layers
currently block search indexing, and there is intentionally no `sitemap.xml`:

- `src/app/layout.tsx` sets `robots: { index: false, follow: false }`.
- `public/robots.txt` is `User-agent: * / Disallow: /`.

This was previously undocumented, so it risked being "fixed" by accident.

## Decision
Keep the site fully de-indexed. This is a deliberate posture, not an oversight.

## Alternatives Considered
- **Index for organic discovery:** rejected for now. The site republishes summaries of
  others' public content; broad search visibility raises IP-exposure and brand-safety
  surface for little benefit to an internal reference tool.
- **Half-open (drop the meta noindex but keep `robots.txt Disallow: /`):** rejected —
  incoherent. `Disallow: /` still blocks crawling, so removing only the meta tag yields no
  discovery while appearing as though it should. Indexing must be all-or-nothing.

## Consequences
- Positive: minimal IP/exposure surface, no SEO maintenance, matches the internal-tool
  positioning.
- Negative: zero organic search traffic; the site is share-by-link only.

## Follow-ups
- If discovery is ever wanted, flip BOTH layers together (remove the meta noindex AND relax
  `robots.txt`) and add a `sitemap.xml`. Do not half-do it.
