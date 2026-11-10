# D-STORE Design System

Foundations for the storefront. Living reference: `/design-system` (run `pnpm storefront:dev`).

| File | What |
| --- | --- |
| `src/styles/tokens.css` | All tokens (`@theme`): colour, type, radius, shadow, layout, motion, keyframes |
| `src/styles/base.css` | Element defaults, focus ring, selection, reduced motion |
| `src/styles/utilities.css` | Type roles, interaction utilities, layout primitives |
| `src/lib/design/tokens.ts` | Motion and breakpoint values for JS |
| `src/lib/utils.ts` | `cn()` class merger |

Default Tailwind colours, radii, shadows, eases and fonts are **removed**. Anything not listed in `tokens.css` is not part of the system.

## Colour

Light theme with a dark navy navbar. Swatches: Navy `#0A1730` (navbar, ink, filled actions), Sky `#7AB3D7` (brand), Teal `#496F90` (accent), Cream `#FEF4F0` (canvas), White. Primitive ramps: `navy`, `teal`, `sky`, `beige`. Components use the **semantic** tokens only:

| Token | Value | Use |
| --- | --- | --- |
| `canvas` | beige-100 | Rounded page sheet |
| `surface` | white | Cards, inset panels |
| `surface-muted` | beige-200 | Chips, inputs, menu pill, media placeholders |
| `surface-strong` | beige-300 | Pressed chip, disabled fill |
| `surface-inverse` (+ `-hover`) | navy-800 / navy-900 | Filled CTA, selected size pill, toasts |
| `surface-tint` | sky-100 | Soft brand highlight |
| `header` / `header-muted` | navy-800 / navy-700 | Navbar and its menu pill |
| `ink` | navy-800 | Primary text (16.5:1 on canvas) |
| `ink-muted` | navy-600 | Prices, secondary text (7.3:1 on canvas) |
| `ink-subtle` | navy-400 | Placeholders, decoration only |
| `ink-inverse` / `ink-on-media` / `ink-on-accent` | white | Text on navy, photos, accent fills |
| `line` / `line-strong` | navy at 11% / 22% | Hairlines, outlined buttons |
| `accent` | teal-500 | Focus ring, active indicators, checked controls |
| `accent-ink` | teal-600 | Accent text and links |
| `accent-soft` / `accent-soft-ink` | sky-200 / navy-800 | Selected chip, tags, text selection |
| `success` / `warning` / `danger` (+ `-soft`) | custom | Stock, pre-order, errors, sale |

## Typography

Amulya Bold (display) + Synonym Regular (body), from Fontshare. Use the `type-*` role utilities, not raw sizes.

| Role | Font | Size | Use |
| --- | --- | --- | --- |
| `type-display-2xl/xl/lg` | Amulya 700 | fluid 36 to 136 | Hero, campaign |
| `type-heading-xl/lg/md/sm` | Amulya 700 | 36 / 28 / 22 / 18 | Page and block headings, PDP title (sm) |
| `type-title` | Amulya 700 | 16 | Section titles ("Latest drop") |
| `type-body-lg/body/body-sm` | Synonym 400 | 17 / 15 / 13 | Copy; card title and price use body-sm |
| `type-caption` | Synonym 400 | 12 | Legal, helper text |
| `type-label` | Synonym 500, caps, +6% | 13 | Button labels ("ADD TO BAG") |
| `type-overline` | Synonym 500, caps, +10% | 11 | Kickers ("FILTER") |
| `type-price` | tabular numbers | inherit | Prices |

To self-host the fonts, download the woff2 files into `src/app/fonts/` and switch `layout.tsx` to `next/font/local` with the same family names.

## Shape

| Token | px | Use |
| --- | --- | --- |
| `rounded-xs` | 6 | Tags, badges, "Size guide" chip |
| `rounded-sm` | 10 | Small icon buttons |
| `rounded-md` | 14 | Thumbnails, inputs, dense grid tiles |
| `rounded-lg` = `rounded-card` | 18 | Product media |
| `rounded-xl` | 24 | PDP info card, drawers, popovers |
| `rounded-2xl` = `rounded-panel` | 32 | Inset panels, mega menu |
| `rounded-3xl` = `rounded-sheet` | 44 | Page sheet top corners |
| `rounded-pill` | full | Every button and chip |

**Concentric rule:** inner radius = outer radius minus the padding between them. `squircle` adds continuous corners where supported.

Elevation stays flat: `shadow-xs/sm/md/lg/glass`, navy tinted. `material` / `material-dark` give iOS frosted glass for bars and chips over photography.

## Icons

Hugeicons, free stroke-rounded set (`@hugeicons/core-free-icons`), wrapped in `src/components/ui/icons.tsx`. Import icons only from there. Default stroke 1.5, size with `size-*`, colour is `currentColor`. Filled states (saved bookmark) use `fill-current`.

## Motion

Press fast, release on a spring, glide overlays on the iOS sheet curve.

| Ease | Duration | Use |
| --- | --- | --- |
| `ease-standard` | 180 to 280ms | Colour, opacity, small state |
| `ease-ios` | 520ms | Sheets, drawers, mega menu |
| `ease-spring` | 600ms | Press release, sliding indicators, reveals |
| `ease-spring-snappy` | 450ms | Popovers, tooltips |
| `ease-spring-bounce` | 900ms | Confirmations only (bag badge) |

Springs are sampled damped oscillators in CSS `linear()` (physics in `tokens.ts`). Durations are CSS vars: `duration-(--duration-spring)`.

Utilities and animations:
- `pressable` on every control: scales to 0.96 in 90ms on press, springs back.
- `pressable-soft` on large tap targets (cards): 0.985.
- `media-zoom` on card images inside a `group`: slow 3.5% zoom on hover.
- `animate-rise-in` (stagger 45ms per item), `animate-scale-in/out` (popovers, use with Radix `data-[state]`), `animate-menu-in/out`, `animate-sheet-in/out`, `animate-drawer-in/out`, `animate-pop`, `animate-fade-in/out`, `skeleton`.
- `prefers-reduced-motion` collapses all motion to ~1ms.

## Layout (from the reference)

```
html (surface, white)
├─ header         .header-grid   bg-header (navy), h 64 / 88, columns 1fr auto 1fr
│   left: New in, Collections   center: wordmark   right: icons (40px) + menu pill (56x36, header-muted)
│   over the hero: transparent, ink-on-media, menu pill white
├─ hero           full bleed image, header sits on top
└─ main           .sheet (.sheet-overlap after a hero)  canvas, rounded-sheet top
    ├─ .section           gutter padding
    │   ├─ .section-head  type-title left, "Discover more" pill right (surface on canvas, inverse on panel)
    │   └─ .product-grid  2 / 3 / 4 cols, gap 8px   (.product-grid-dense: 4 / 6 / 12, image only)
    ├─ .page-x > .panel   surface inset container, rounded-panel, its own section-head + grid
    └─ footer             sign-up + link columns in a panel, small logo in the legal row
```

- **Gutter** `px-gutter` 16 to 28px. **Grid gap** `gap-tile` 8px. **Section spacing** `py-section`.
- **Card ratio:** every card and product image uses `aspect-card` (3:4, token `--aspect-card`). Do not use ad-hoc ratios.
- **Product card:** media `aspect-card rounded-card`, bookmark top right, carousel dots bottom center, "Sold out" top left with the whole card at ~45% opacity. Meta row `px-3 pt-2.5`: title `type-body-sm font-medium`, price `type-body-sm type-price text-ink-muted`, 32px "+" quick add on the right.
- **Product page:** `.pdp-grid` = three columns from `lg`: pinned main image (`aspect-card`, width capped so it always fits the viewport height) | vertical list of every view that scrolls with the page (click to swap the main image) | pinned details column (`.pdp-pinned`) that starts at the top and fills the height: purchase card (collection kicker, title, price, 4-per-row size pills, Add to bag + Buy now, perks row), tabs card that grows, "Complete the look" row. Sold out swaps the CTAs for Sold out + Notify me. Below `lg`: swipe carousel, then details.
- **Mega menu:** drops below the header as a `rounded-panel` canvas sheet (`animate-menu-in`). Collections list left (`type-title`), category groups with surface chip pills, "Shop by color" chips with overlapping swatch dots. Menu pill becomes an X.
- **Filter drawer:** right side (`animate-drawer-in`), centered overline title + product count, chip groups separated by hairlines, "Sort by" select, sticky footer with outlined "Remove all" + filled "Apply".
- **Sign in:** centered single column (max 24rem), wordmark top, email field with an inline arrow button, consent checkbox, caption legal line.

## Rules

1. Light pages, navy navbar (`header`). Black becomes navy, grey becomes beige. No neutral greys.
2. Navy means action: primary buttons and selected states use `surface-inverse` with `ink-inverse`.
3. Teal is a signal, never a large fill. Accent text uses `accent-ink`; text on an accent fill uses `ink-on-accent`.
4. Every action is a pill. Rectangles are for media and containers.
5. Concentric corners. A child never has a larger radius than its parent.
6. Every interactive element is `pressable`. Overlays use `ease-ios`. Bounce only confirms.
7. Use `type-*` roles. Amulya for display, headings and titles. Synonym for everything you read.
8. Photography leads: hairlines over shadows, generous gutters, 8px between cards.
