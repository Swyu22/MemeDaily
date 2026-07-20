# ADR-006: Separate Untrusted Agent Research From Trusted Publication

## Status
Accepted

## Context
The daily publishers ask a model to read untrusted public-web material and produce a JSON
artifact. Giving that same process shell access, broad repository writes, package lifecycle
execution, persisted checkout credentials, or a push token creates a prompt-injection path
from source text to repository compromise. Agent-authored timestamps also cannot prove when
trusted publication actually occurred.

## Decision
Use two jobs for each feed:

1. The model-facing job is passed the short-lived job `GITHUB_TOKEN` explicitly with only
   `contents:read`, so the Action cannot exchange OIDC for its separate write-capable App
   token. The model cannot execute shell commands, may read only the working directory, and
   may write only the exact dated JSON path. It uploads that artifact.
2. The trusted publish job checks out clean repository code without persisted credentials,
   downloads only the artifact, stamps `generated_at` / `published_at` with
   `scripts/stamp-publish-time.ts`, rejects sources later than that trusted clock, validates
   the entire repository, commits locally, rebases without a write token, reinstalls from the
   final lockfile, and validates the exact rebased tree again. Only a separate final push/Pages
   step receives `GITHUB_TOKEN`; a new race after validation fails closed as non-fast-forward.

All third-party and official workflow actions are pinned to full commit SHAs. Local Codex
publishing remains a supervised recovery option because an instruction prompt cannot provide
the same mechanical OS-level isolation.

## Alternatives Considered
- **Allow `npm run validate` in the model job:** rejected because dependency lifecycle or a
  modified validator could execute while the subscription/OAuth context is present.
- **Let the agent commit directly:** rejected because it combines untrusted input, arbitrary
  repository mutation, and write credentials in one security boundary.
- **Trust model-generated publication time:** rejected because it is self-asserted and may be
  later than the sources it claims were known at publication.

## Consequences
- Positive: public-web prompt injection cannot directly execute commands, rewrite arbitrary
  project files, or use git credentials; chronology is stamped by trusted code.
- Positive: validation uses the repository's reviewed implementation, not an agent-modified
  copy.
- Positive: package lifecycle scripts and validation commands never inherit the repository write
  token, and a concurrent feed commit cannot enter the final pushed tree without validation.
- Negative: workflow structure is more verbose and must preserve exact-path permissions.
- Negative: source capture times are an upper-bound claim. Historical impossible values are
  clamped, but their exact original capture moments cannot be reconstructed.

## Verification
- CI checks workflow YAML and repository tests; audit scripts verify action SHA pins and
  model-job permissions, post-rebase validation order, and token confinement.
- `scripts/stamp-publish-time.test.ts` covers both feed schemas, trusted stamping, preservation
  of earlier source times, and rejection of future source times.
- The first scheduled runs after this decision remain an operational monitoring item.

## Amendment (2026-07-20): shell-less agent resilience
Removing shell also removed the agent's `npm run validate` self-check loop; malformed agent JSON
then surfaced only in the trusted publish job (memes 2026-07-15, news 2026-07-20 ×2). The
confinement contract is unchanged, with three additions that stay outside the model boundary:
- A deterministic, dependency-free `node -e JSON.parse` step in the agent job (after the model
  step, before artifact upload) fails fast on non-well-formed output. It executes no repo or npm
  code and sees no write token, so the rejected-alternative rationale above does not apply.
- The prompts now mandate a Read-back self-check after every Write/Edit (the only verification
  channel a shell-less agent has); schema-level gates still run only in the trusted publish job.
- The dedup guard now reads today's envelope from the live `origin/main` tip (anonymous fetch,
  worktree fallback), so a dispatch queued behind an in-progress publish no-ops instead of
  re-running the agent against a stale pinned checkout; catch-up dispatches retry transient API
  failures instead of dying on the first 503.
