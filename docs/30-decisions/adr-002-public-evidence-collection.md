# ADR-002: Use Public-Web Evidence Collection

## Status
Accepted

Amended by ADR-008 for envelopes dated 2026-07-26 or later: public-web
collection still fails closed on unavailable evidence, but `skipped`/0–2 items
are no longer successful terminal output. Bounded recovery continues until three
qualified items are available or an incident remains open.

## Context
The product needs daily evidence that a meme appeared in Chinese internet platforms,
but direct logged-in scraping of Weibo, Douyin, Xiaohongshu, or Bilibili carries
platform, privacy, and operational risk.

## Decision
Use public web intelligence only:

1. Platform public pages when reachable.
2. Public hot-list aggregators or list archives as secondary evidence.
3. Search results, media reports, and spillover discussion for auxiliary context.
4. LLM/content judgment only after evidence is collected.

Each published item must have at least two independent URLs and at least one
`platform_public` or `aggregator` source.

## Alternatives Considered
- **Logged-in scraping:** rejected due to account, privacy, and platform risk.
- **Official APIs only:** safer but may not cover the needed meme discovery surface.
- **Manual editorial review:** rejected because the product goal is no-ops automation.

## Consequences
- Positive: lower legal/platform risk, clearer audit trail, fewer secrets, easier
  public-repo operation.
- Negative: evidence quality varies and some platform pages may disappear or block
  requests; `partial` days and visible recovery incidents are expected.

## Trade-off
Lower-risk, evidence-backed automation is prioritized over exhaustive platform coverage.
