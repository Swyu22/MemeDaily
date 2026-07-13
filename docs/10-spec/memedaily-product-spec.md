# MemeDaily Product Spec

## Purpose
MemeDaily is a daily Chinese internet meme intelligence desk for internal content,
marketing, and communications teams. It is not a general news site and not a public
consumer community.

## Core Jobs
- **Triage:** see what is worth noticing today in one to two minutes.
- **Decide:** understand whether a meme can still be used, how a brand could use it,
  and what risk to avoid.
- **Lookup:** search prior days and open a permanent detail URL for sharing.

## Data Contract Summary
- One file per day: `data/daily/YYYY-MM-DD.json`.
- Daily envelope includes `schema_version`, `policy_version`, `rubric_version`,
  `date`, `generated_at`, `status`, `run_report`, and `items`.
- Each published item requires:
  - stable `id`
  - `title`
  - `platform[]`
  - `type`
  - `summary`
  - `origin`
  - `usage`
  - `fun_point`
  - `why_spread`
  - `lifecycle`
  - `brand_usage`
  - `risk`
  - at least two independent `sources[]`
- Each source includes `tier`, `evidence_role`, `platform`, `url`, `captured_at`,
  and a short `note`.

## Evidence Gate
- Publish only when an item has at least two independent reachable URLs.
- At least one source must be `platform_public` or `aggregator`.
- Items supported only by search results, media reports, or spillover discussion are
  discarded.
- Store URLs and compact notes only. Do not store media, screenshots, comment dumps,
  private account data, or long excerpts.

## Safety Gate
Drop, do not display, any candidate involving:
- politics or current affairs sensitivity
- social tragedies, accidents, crimes, disasters, or public safety incidents
- celebrity controversies, scandals, private disputes, or fan wars
- minors as identifiable subjects
- privacy invasion, doxxing, or ordinary people being targeted
- harassment, attacks, slurs, discrimination, or regional insults
- explicit, illegal, bloody, violent, harmful-rumor, or dangerous content

## Meme-Shell Gate
The candidate must have a reusable shell: phrase, template, BGM, visual setup,
action pattern, persona, or remix structure. A high-heat one-off news event is not
a meme for this product.

Avoid topics that are mainly about one specific brand, product launch, company dispute,
or marketing claim. Brand names can appear in evidence sources, but the published card
should stand on a generalized meme shell rather than a single company's news cycle.

## UI Requirements
- Today desk: date-grouped feed, latest day first, compact cards, visible source rows,
  inline details, copy-away action.
- Archive/search: keyword search, day/library view, platform/type/range filters,
  lifecycle and value display.
- Meme detail: permanent URL, full fields, source links, history, related memes,
  copy link and copy-away actions.
- Mobile source rows must wrap cleanly; no forced `white-space: nowrap` that causes
  vertical text or clipped evidence links.

## Automation Requirements
- The daily automation runs unattended in GitHub Actions (`daily-publish.yml`) on a cloud
  cron (~07:40 Asia/Shanghai), with `daily-catchup` re-publishing if a scheduled run is
  dropped. The local Codex App run (07:15) is an optional manual fallback only.
- Automation writes one complete daily file, validates it, builds the site, then
  commits and pushes.
- Automation targets 10 publishable items per day by expanding public hot-list
  aggregators and search queries before giving up. It must never fabricate sources
  or publish unsafe/weak-evidence items only to fill the count.
- GitHub fallback creates a `skipped` envelope if the daily file is missing after
  the expected publication window.
- Invalid JSON must fail CI/build and leave the last successful site online.

## Reference
The fuller Chinese product rationale remains in `产品方案.md`.
