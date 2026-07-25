# ADR-007: Codex Cloud Submits One-File Candidates to a Trusted Publisher

## Status

Accepted, superseding ADR-006's Anthropic/GitHub-Actions model-facing job while
preserving its trust separation.

## Context

The Anthropic subscription publisher stopped running, and the product needs an
unattended operator that does not depend on the owner's Mac. ChatGPT Work / Codex
Cloud Scheduled tasks can browse public sources and use the connected GitHub tool,
but web tasks do not retain a local repository folder or worktree.

Public pages are attacker-influenceable. A cloud task that both researches them and
can publish `main` would collapse the untrusted research and trusted release
boundaries established by ADR-006. GitHub scheduled events and the prior external
cron also proved too easy to drop or drift independently.

## Decision

Use Codex Cloud for all unattended triggers and keep final publication inside the
repository:

1. Protect `refs/heads/main` with the active repository ruleset
   `codex-trusted-main`: the branch cannot be updated by ordinary users or connected
   apps; only repository write deploy keys may bypass. The repository has one such key,
   `MemeDaily trusted publisher`; its private half exists only as the Actions secret
   `CODEX_PUBLISH_DEPLOY_KEY` and is exposed only to final trusted push steps. This also
   prevents a cloud task from merging its own candidate PR. Code-maintenance merges
   require a deliberate temporary ruleset change by the repository owner.
2. Eight dedicated cloud task contexts own eight Asia/Shanghai trigger groups—one
   heartbeat per context because the service permits only one active heartbeat in
   each conversation. Together they cover each feed's primary, catch-up, monitor,
   and late fallback modes.
3. Every run rereads `ai/prompts/CODEX_CLOUD_RUNBOOK.md`, the current living
   per-feed rules, schema, and recent envelopes from GitHub `main`.
4. A content/fallback run may create or update only one same-repository branch:
   `codex/daily-meme-YYYY-MM-DD` or `codex/daily-news-YYYY-MM-DD`. It writes only
   that feed/date JSON and opens one PR. It never merges or targets another path.
5. `.github/workflows/codex-daily-pr-publish.yml` uses
   `pull_request_target`, but never checks out or executes the PR tree. Its
   read-only job requires a same-repository exact branch, confirms the PR changes
   exactly the expected JSON, fetches only that blob through the GitHub API,
   applies the trusted clock, and runs the full repository checks.
6. A separate trusted job downloads only the accepted JSON, resets to current
   `main`, refuses to replace any existing live envelope, stamps and revalidates,
   rebases and revalidates again, then receives a write token only for the final
   push. It first adopts the Pages run emitted by that deploy-key push; if no such
   run appears or it fails, it dispatches one bounded recovery run. It waits for a
   run covering the accepted SHA (or descendant) to succeed before closing the
   candidate PR.
7. GitHub `schedule:` and external cron triggers are retired. The deterministic
   fallback and monitor workflows remain `workflow_dispatch`-only recovery tools.

## Security Properties

- Web content cannot change commands, validators, workflows, or the trusted
  checkout through the accepted artifact path.
- A fork cannot enter the trusted publisher; the PR head repository must equal the
  base repository.
- An arbitrary same-repository branch/path cannot enter; branch, date, file count,
  target path, and envelope date must all match.
- A connected Cloud GitHub app cannot update or merge `main`; the repository ruleset
  permits only the dedicated deploy key to perform the final branch update.
- The candidate job has read-only contents/PR permissions and no repository write
  token. The trusted publish job never executes candidate-controlled code.
- The normal `GITHUB_TOKEN` is read-only for contents; it can inspect/dispatch Actions
  and close the accepted PR, but cannot update protected main. Only the final step
  receives `CODEX_PUBLISH_DEPLOY_KEY`.
- Existing live-main envelopes are terminal, so primary, catch-up, and fallback
  races become no-ops.
- All final writers share `daily-data-publish` concurrency and fail closed on
  live-main fetch, validation, non-fast-forward push, or Pages failure.

The connected GitHub tool still has account-level branch/PR permissions. Exact-path
behavior is a cloud-task operating contract; the active main ruleset plus trusted
workflow form the mechanical production boundary. Review connector permissions and
the first scheduled runs as defense in depth.

## Alternatives Considered

- **Let a cloud task push or merge `main`:** rejected; it combines untrusted web
  input with production credentials.
- **Run Codex as an unattended local desktop task:** rejected as the primary path;
  it depends on the Mac being awake and exposes the local checkout/credentials.
- **Keep the Anthropic GitHub Action or external cron as backup:** rejected because
  the user requested complete Codex takeover and duplicate schedulers obscure
  ownership.
- **Trust a PR merge after ordinary CI:** rejected; the dedicated ingest workflow
  must extract only data and use trusted base code before any publication token.

## Consequences

- Positive: schedules run without the user's machine and have one owner.
- Positive: cloud research can recover by updating the same failed candidate PR,
  while main publication stays deterministic and audited.
- Positive: successful publication includes production deployment evidence, not
  merely a git push or opened PR.
- Positive: prompt injection cannot turn the Cloud connector into a direct-main or
  self-merge path.
- Negative: cloud tool availability/permissions are an external dependency.
- Negative: the candidate PR adds latency and leaves failed runs visible for
  diagnosis.
- Negative: first-run observation remains necessary because scheduled tasks and
  connected tools are account-level services outside repository CI.
- Negative: ordinary code-maintenance PRs cannot update `main` while the Actions-only
  ruleset is active; the owner must deliberately suspend/amend it for reviewed
  maintenance, then restore and reverify it.

## Verification

- `scripts/workflow-security.test.ts` asserts the same-repository, exact-branch,
  one-file, trusted-checkout, SHA-pin, token-order, and no-GitHub-cron contracts.
- `scripts/publish-reliability.test.ts` covers bounded dispatch retries, correlated
  Pages success, shared writer concurrency, live-tip fallback, and deployment
  alerts.
- CI runs production high-severity dependency audit plus the canonical full check;
  Pages repeats the production audit and full check before deployment.
- Operational acceptance requires inspecting all eight active cloud schedules,
  exercising one candidate, and confirming live `main`, Pages SHA/run, and
  `https://memedaily.fun` agree.
- `GET /repos/Swyu22/MemeDaily/rulesets` plus the selected ruleset detail must show
  enforcement `active`, `refs/heads/main`, an `update` rule, and the sole bypass
  type `DeployKey`. Repository deploy keys must contain exactly one writable key titled
  `MemeDaily trusted publisher`. A real manual fallback run proves the trusted final
  step can still update main.
