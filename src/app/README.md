# App Module

Next.js App Router entry points and global presentation. Routes compose feature modules and
domain data; this directory must not import automation scripts.

| File | Responsibility |
| --- | --- |
| `layout.tsx` | Metadata, self-hosted fonts, PWA boot/registration, header, and app shell |
| `page.tsx` | Static home data composition for meme and news feeds |
| `homeRunState.ts` | Pure latest-run status and stale-content composition for both feeds |
| `page.test.ts` | Latest-run status and stale-content composition regression coverage |
| `archive/page.tsx` | Static archive/search route |
| `meme/[id]/page.tsx` | Static meme detail routes and metadata |
| `globals.css` | Base tokens, shared desktop styles, focus, and component presentation |
| `responsive.css` | Responsive breakpoints extracted to keep first-party files under 800 lines |

Behavior belongs in `src/features/`; schemas, loaders, and policy rules belong in
`src/domain/`.
