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
   the entire repository, then exposes
   `GITHUB_TOKEN` only to the final authenticated pull/commit/push step.

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
- Negative: workflow structure is more verbose and must preserve exact-path permissions.
- Negative: source capture times are an upper-bound claim. Historical impossible values are
  clamped, but their exact original capture moments cannot be reconstructed.

## Verification
- CI checks workflow YAML and repository tests; audit scripts verify action SHA pins and
  model-job permissions.
- `scripts/stamp-publish-time.test.ts` covers both feed schemas, trusted stamping, preservation
  of earlier source times, and rejection of future source times.
- The first scheduled runs after this decision remain an operational monitoring item.
