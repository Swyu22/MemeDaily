# ADR-001: Use GitHub Pages Static Publishing

## Status
Accepted

## Context
MemeDaily needs a low-maintenance daily publishing target. The user does not want
Supabase, OpenAI API usage, or a server that requires ongoing operations. The domain
`memedaily.fun` is registered but should avoid ICP filing. The repository was created
as `Swyu22/MemeDaily`.

> Update (2026-06): This ICP stance has reversed — ICP 备案 is now being actively pursued.
> The custom domain `memedaily.fun` is temporarily detached (Pages custom domain removed +
> Aliyun DNS records disabled) and the site is served from the github.io project subpath
> during filing; it will be re-attached after approval. The GitHub Pages decision itself is
> unchanged. See `.cloud.md` for the re-attach checklist.

## Decision
Use a static web app built from repository JSON files and published through GitHub
Pages. Daily content updates are normal git commits.

## Alternatives Considered
- **Vercel:** simple for Next.js, but not necessary and adds another hosted platform.
- **Cloudflare Pages:** good for private repo + public deploy, but not required for
  the first version.
- **Alibaba Cloud OSS/Function Compute:** feasible on Hong Kong/overseas regions,
  but more operational setup than GitHub Pages.
- **Server + database:** unnecessary for a read-only archive and increases maintenance.

## Consequences
- Positive: no database, no runtime backend, simple audit trail, easy rollback, free
  Pages hosting for a public repo.
- Negative: repository and published static content are public on GitHub Free, so no
  sensitive data can be committed.

## Trade-off
Operational simplicity is prioritized over private hosting and server-side access
control for the first version.
