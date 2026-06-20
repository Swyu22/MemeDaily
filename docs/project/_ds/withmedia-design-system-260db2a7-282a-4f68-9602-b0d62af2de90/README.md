# WithMedia.与众 — Design System

Internal design system for **WithMedia.与众**'s management system (公司内网 / intranet).
This is the single source of truth for colors, type, components, and UI patterns. All
internal-tool pages should be built against it.

> **Slogan:** With a rabbit in mind / 创若脱兔
> **Stack target:** Next.js + Tailwind CSS + shadcn/ui. Tokens here map 1:1 to the
> shadcn/ui CSS-variable model, so this system drops straight into that stack.

---

## 1. Company context

**WithMedia.与众** is a design & creative company in Shenzhen (深圳), founded in **2011**.
Service lines:

- 视觉设计 — Visual / graphic design
- 影视制作 — Film & video production
- 营销策划 — Marketing & campaign planning
- 交互开发 — Interactive development
- 线下活动 — Offline events / experiential

The brand identity is a **yellow-and-black rabbit** theme. The rabbit (脱兔 — "a darting
hare") signals speed, agility, and creative leap; the slogan *创若脱兔* riffs on the idiom
动若脱兔 ("move like a startled hare"). The visual language pairs **near-black** structure
with a single punchy **brand yellow** accent on **white** backgrounds.

### What we are building
The internal management system is a clean, professional **operations tool** — project
tracking, team coordination, resourcing. The aesthetic is "creative-company taste, but a
**restrained, efficient internal tool**": flat, modern, moderate information density, never
flashy. Soft shadows, comfortable whitespace, moderate radii.

### Sources
No external resources (codebase, Figma, decks, font files, or the actual logo artwork) were
provided. This system was authored from the written brief + the shadcn/ui design language.
**Two assets are interim placeholders and should be replaced** (see Caveats at bottom):
- The brand mark in `assets/logo-mark.svg` is a typographic monogram, **not** the real
  yellow-black rabbit logo.
- Fonts are linked from Google Fonts (Space Grotesk + Noto Sans SC + JetBrains Mono);
  production should self-host and may swap CJK to a licensed face (PingFang SC / MiSans).

---

## 2. Index — what's in this folder

| Path | What it is |
|---|---|
| `README.md` | This file — context, content & visual foundations, iconography, index |
| `colors_and_type.css` | All design tokens: palette, semantic vars, status colors, radii, shadows, spacing, type scale + semantic type classes |
| `SKILL.md` | Agent Skill manifest — makes this folder usable as a Claude Skill |
| `assets/` | Logos / brand marks (interim wordmark + monogram) |
| `preview/` | Small spec cards that populate the Design System tab (type, color, spacing, components, brand) |
| `ui_kits/intranet/` | High-fidelity UI kit for the internal management system (login, dashboard, projects, dialog) — JSX components + interactive `index.html` |
| `fonts/` | Reserved for self-hosted webfonts in production (currently fonts load via Google Fonts) |

Start with `colors_and_type.css` for tokens, then browse `preview/` for visual specs and
`ui_kits/intranet/index.html` to see the system assembled.

---

## 3. Content fundamentals (copy & tone)

The product is an **internal tool for a creative team**, so copy is **bilingual-leaning-Chinese**,
warm-but-efficient, and never corporate-stiff.

- **Language:** Chinese-first (简体中文). UI labels, nav, and content are in Chinese. Latin
  appears for the brand name (WithMedia.), product/feature codenames, IDs, dates, and numbers.
- **Tone:** Clear, direct, a little friendly. We're talking to colleagues, not customers.
  Think "干净利落" — get to the point. Light personality is allowed (the brand has a sense of
  humor) but the tool itself stays calm.
- **Person:** Address the user with implicit "你" sparingly; mostly write **labels and
  objects**, not sentences. e.g. `新建项目`, `我的任务`, `本周交付`. Avoid "您" (too formal for
  an internal tool) and avoid "我的" overuse.
- **Casing:** Chinese has no case. For Latin, use the brand's own casing **WithMedia.**
  (capital W, capital M, trailing period). Feature names in Title Case; system/status words
  in Chinese.
- **Length:** Terse. Buttons are 2–4 characters (`保存`, `新建项目`, `导出`). Section titles
  are nouns (`项目概览`, `团队`, `资源`). Empty states get one friendly sentence + one action.
- **Numbers & dates:** Tabular, mono font. Dates as `2026-06-02`; ranges with `→`. Currency
  `¥`. Counts get a unit (`12 个项目`, `3 位成员`).
- **Emoji:** **Not used** in the product UI. Status is communicated with colored badges/dots,
  not emoji. (Marketing/creative output is a separate context — this rule is for the tool.)
- **Punctuation:** Use full-width Chinese punctuation in Chinese sentences（，。、）; keep
  half-width for Latin/numbers. Don't end button labels with punctuation.

**Examples**
- Button: `新建项目` · `邀请成员` · `导出报表` · `标记完成`
- Nav: `工作台` · `项目` · `任务` · `团队` · `资源` · `设置`
- Status: `进行中` · `流程中` · `已暂停` · `已完成` · `已取消`
- Empty state: `还没有项目。创建第一个，开始追踪进度。` + `[新建项目]`
- Toast (success): `已保存` / (error): `保存失败，请重试`

---

## 4. Visual foundations

The system is **shadcn/ui at its core**: white surfaces, thin neutral borders, soft low-contrast
shadows, near-black primary, and one disciplined yellow accent.

- **Color vibe:** Bright and neutral, not warm/cool-tinted. Backgrounds are pure white
  (`--background #FFFFFF`) and a faint `zinc-50` for app shells. Text is near-black
  (`zinc-900`), secondary text `zinc-500`. **Yellow is rationed** — it marks the active nav
  item, key primary CTAs, the logo, and highlight bars. It is never a hover fill and never a
  large background wash. Default buttons are near-black, not yellow.
- **Type:** A bilingual pairing — **Space Grotesk** for Latin, numerals and the brand
  wordmark (a clean geometric grotesk that adds a little design character), and **Noto Sans
  SC** (思源黑体) for all Chinese, headings and body alike (clean, professional, legible).
  **JetBrains Mono** for IDs/numbers/code. UI base size **14px** (the workhorse), 12px for
  captions, 16–30px for headings. Weights 400/500/600/700.
  Headings use slight negative tracking (`-0.01em`); overlines use uppercase + `0.08em`.
  CJK stays the clean, restrained face — no decorative display fonts in the tool.
- **Spacing:** Tailwind 4px scale. Comfortable but not airy — cards pad `16–24px`, page
  gutters `24–32px`, form rows gap `12–16px`. Information density is **medium**: dense enough
  to scan a project table, loose enough to breathe.
- **Backgrounds:** Flat. No gradients, no photographic hero washes, no textures or patterns in
  the tool. App shell is `zinc-50`; content surfaces are white cards. The only "decoration"
  permitted is a thin brand-yellow accent bar or a small yellow dot.
- **Corner radii:** Moderate. Base `8px` (`--radius`); inputs/buttons `6–8px`; small chips
  `4px`; cards and dialogs `10–14px`; avatars/dots fully round. Never sharp (0) and never
  pill-everything.
- **Borders:** Hairline `1px solid zinc-200` for cards, inputs, table rows, dividers. Borders
  do most of the separation work; shadows are reserved for things that float.
- **Shadows / elevation:** Soft, low-opacity, neutral (zinc-tinted, never pure black). Resting
  cards use `shadow-sm` or just a border; dropdowns/popovers `shadow-md`; dialogs `shadow-xl`
  with a `zinc-900/40` scrim. No colored or glowing shadows.
- **Focus:** Two-layer ring — a `2px` background gap then a `2px` `--ring` (zinc-900). Inputs
  also darken their border on focus. Keyboard focus is always visible.
- **Hover states:** Neutral and subtle. Ghost/secondary controls hover to `zinc-100`; primary
  (near-black) buttons lighten slightly (`zinc-800`); brand-yellow CTAs go to `brand-500`;
  links go `zinc-900`→underline. Rows hover to `zinc-50`.
- **Press / active:** Slight darken (one step down the scale), **no scale-shrink bounce**.
  Active nav item gets a yellow left-marker + `zinc-100` fill.
- **Transparency & blur:** Used only for overlays — dialog scrim (`zinc-900/40`), occasional
  sticky-header backdrop blur. No frosted-glass everywhere.
- **Animation:** Quiet and quick. `150–200ms` ease-out for hovers, fades, and dropdowns;
  dialogs fade + 4–8px rise. Easing `cubic-bezier(0.16,1,0.3,1)` for entrances. No bounces, no
  springy motion, no looping/attention animations in the tool.
- **Cards:** White, `1px zinc-200` border, `10–14px` radius, `16–24px` padding, optional
  `shadow-sm`. Header row (title + optional action), body, optional footer divided by a
  hairline. This is the dominant content container.
- **Imagery:** The tool is largely imagery-free (it's an ops tool). Where avatars/thumbnails
  appear, they're square-rounded or circular, neutral-framed. No stock photography in the UI.

---

## 5. Iconography

- **Icon set: [Lucide](https://lucide.dev)** — the default shadcn/ui icon library. Outline
  style, **1.5–2px stroke**, 24px grid, rounded line caps/joins. This matches the flat,
  professional, slightly friendly tone. Loaded via CDN in previews
  (`https://unpkg.com/lucide@latest`); in production import `lucide-react`.
- **Sizing:** `16px` inline with text/buttons, `18–20px` in nav/toolbars, `24px` for empty
  states / feature headers. Stroke stays constant; don't scale strokes up.
- **Color:** Icons inherit `currentColor` — typically `zinc-500` at rest, `zinc-900` when
  active/hovered. Yellow icons only inside a yellow context (e.g. on the logo).
- **No emoji** as icons anywhere in the tool. **No unicode glyph hacks** (✓ ✕ ★) as UI icons —
  use the Lucide equivalents (`check`, `x`, `star`). Decorative status uses colored dots, not
  glyphs.
- **No hand-drawn / bespoke SVG icons** unless an exact Lucide match is missing; if one is
  missing, pick the closest Lucide icon and keep the stroke weight consistent.
- **Logo / brand mark:** `assets/logo-mark.svg` is an **interim** typographic monogram, not the
  real rabbit logo. Replace with the official yellow-black rabbit artwork (SVG preferred) when
  available; keep the wordmark "WithMedia." lockup beside it.

---

## 6. Status badge conventions

The core semantic pattern for the project/task tool. Each status = a tinted background + a
solid dot + colored text. Defined as tokens in `colors_and_type.css`.

| Status | Chinese | Color | Meaning |
|---|---|---|---|
| Active / in-progress | `进行中` | **Green** | Work actively underway |
| Process running | `流程中` | **Blue** | An automated/approval flow is in progress |
| Paused | `已暂停` | **Yellow/Amber** | On hold, blocked, awaiting input |
| Completed | `已完成` | **Gray** | Finished / archived |
| Canceled / danger | `已取消` | **Red** | Canceled, failed, or destructive |
