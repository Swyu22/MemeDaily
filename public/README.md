# Public Assets

Files in this directory are copied unchanged into the static export.

| Path | Responsibility |
| --- | --- |
| `sw.js` | Scope-aware network-first service worker and app-owned caches |
| `offline.html` | Standalone fallback for an uncached offline navigation |
| `manifest.webmanifest` | Root/subpath-portable install metadata |
| `fonts/` | Self-hosted Space Grotesk, Noto Sans SC, and JetBrains Mono bundle |
| `favicon.ico`, `icon-*.png`, `apple-icon-t.png` | Browser and installed-app icons |
| `share.png` | Open Graph/Twitter share image |
| `CNAME` | Current custom-domain declaration; remove for project-subpath deployment |
| `cc6f97658cc6c1ad349a968fd65d3ad9.txt` | Required WeChat domain ownership token |

Do not place secrets, login state, copied platform media, or unpublished material here.
