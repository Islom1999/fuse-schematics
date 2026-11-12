# UI spec: theming, global styles and assets

Status: functional specification for a clean-room rewrite. It is the only source the implementer needs.
The implementation goes under `src/@ui/` (theming code, Tailwind plugin(s), global stylesheets, splash screen) of the starter template `src/fuse-starter/files`.

Conventions:
- **MUST** means it is required for visual parity or for the existing templates to keep working.
- **SHOULD** means it is recommended.
- "Measured" means the value was read from the running reference app (`http://localhost:4310`, Chrome, 1440x900, logged in, `/example?layout=classy`) with `getComputedStyle`. When the source intent and the measured result differ, this spec gives the **measured** result as the target, because the visual design must not change. Each such difference is flagged.
- Colors are in hex. `slate-*`, `indigo-*` and similar names refer to the stock Tailwind CSS 3.4 palettes.

---

## 1. Design tokens

### 1.1 Theme model

- A **theme** is a named set of three color palettes: `primary`, `accent` and `warn`.
- Each palette has:
  - the shades `50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`;
  - a `DEFAULT` color;
  - a matching **contrast ("on-") palette** with the same keys. It gives the text color that reads on top of each shade.
- Six themes exist. They are selected by a class on `<body>`:

| Theme id (body class) | Display name | primary source | DEFAULT primary |
|---|---|---|---|
| `theme-default` | Default | Tailwind `indigo` | indigo-600 `#4f46e5` |
| `theme-brand` | Brand | **generated** from a single color `#2196F3` (algorithm in 1.3) | the 500 shade `#2196f3` |
| `theme-teal` | Teal | Tailwind `teal` | teal-600 `#0d9488` |
| `theme-rose` | Rose | Tailwind `rose` | the 500 shade `#f43f5e` (no explicit DEFAULT) |
| `theme-purple` | Purple | Tailwind `purple` | purple-600 `#9333ea` |
| `theme-amber` | Amber | Tailwind `amber` | the 500 shade `#f59e0b` (no explicit DEFAULT) |

Inheritance:
- Only `default` defines `accent` and `warn`. Every other theme overrides only `primary` and inherits `accent` and `warn` from `default`.
  - `accent` is Tailwind `slate` with DEFAULT slate-800 `#1e293b`.
  - `warn` is Tailwind `red` with DEFAULT red-600 `#dc2626`.
- Rule for DEFAULT: when a palette does not specify `DEFAULT`, `DEFAULT` equals its `500` shade.
- The theme list (id + display name) is app configuration. It is shown in the Settings drawer as six chips, in the order above, two rows of three.

### 1.2 Contrast ("on-") palette algorithm

For each palette:
1. Find the palette's "dark anchor". It is the color in the palette (all shades, including 950 and DEFAULT when present) that has the **highest WCAG 2 contrast ratio against white**.
2. For each shade S, compute the WCAG contrast of S against the dark anchor and against white `#FFFFFF`. The on-color of S is whichever of the two gives the higher contrast. White wins ties.
3. Explicit overrides win over the computed value. Only one override exists: in `default`, `on-warn-500` is `#fef2f2` (red-50) instead of the computed dark anchor. Because `warn` is inherited, this override applies to every theme.

### 1.3 Palette generation from a single color (used by `brand`)

Input: one base color C. It becomes shade 500. The output is shades 50–900; no 950 is generated.
1. Build a **light end-point**: mix white toward C by 1/49 of the way, interpolating in linear-RGB (square each sRGB channel, interpolate, then take the square root). Round it to 8-bit integers.
2. Build a **dark end-point**: mix black toward C by 1/9 of the way, in linear-RGB. Round it to integers.
3. Define a piecewise scale on [0, 1] with three stops: light end-point at 0, C at 0.5, dark end-point at 1. Interpolate in linear-RGB between stops.
4. Shade N is the scale sampled at N/1000. For example, 50 is the scale at 0.05 and 900 is the scale at 0.9. Round each shade to hex.

Verification: with C = `#2196F3`, the end-points are `#fcfdff` and `#0b3251`. The result is exactly the brand row in 1.4.
The generator SHOULD also accept a partial palette that has a 500 key. Every given shade then becomes an extra stop at position N/1000.

### 1.4 Concrete palette values (measured, MUST match)

**primary** (shades 50 → 950; the last column is DEFAULT):

| theme | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 | DEFAULT |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| default | #eef2ff | #e0e7ff | #c7d2fe | #a5b4fc | #818cf8 | #6366f1 | #4f46e5 | #4338ca | #3730a3 | #312e81 | #1e1b4b | #4f46e5 |
| brand | #eff5fe | #e2ecfd | #c4dafa | #a1c6f8 | #74b0f5 | #2196f3 | #1e88dc | #1a78c3 | #1766a6 | #125183 | (#1e1b4b, see note) | #2196f3 |
| teal | #f0fdfa | #ccfbf1 | #99f6e4 | #5eead4 | #2dd4bf | #14b8a6 | #0d9488 | #0f766e | #115e59 | #134e4a | #042f2e | #0d9488 |
| rose | #fff1f2 | #ffe4e6 | #fecdd3 | #fda4af | #fb7185 | #f43f5e | #e11d48 | #be123c | #9f1239 | #881337 | #4c0519 | #f43f5e |
| purple | #faf5ff | #f3e8ff | #e9d5ff | #d8b4fe | #c084fc | #a855f7 | #9333ea | #7e22ce | #6b21a8 | #581c87 | #3b0764 | #9333ea |
| amber | #fffbeb | #fef3c7 | #fde68a | #fcd34d | #fbbf24 | #f59e0b | #d97706 | #b45309 | #92400e | #78350f | #451a03 | #f59e0b |

Note: brand has no 950 shade. In the reference, `primary-950` under `theme-brand` falls through to the default theme's value `#1e1b4b`, and `on-primary-950` falls through to `#FFFFFF`. The app never uses `primary-950`. The new implementation MAY reproduce this, or MAY extend the generator to emit 950. Either is acceptable.

**on-primary** (contrast):

| theme | dark anchor | shades using the anchor | shades using #FFFFFF | on-DEFAULT |
|---|---|---|---|---|
| default | #1e1b4b | 50–400 | 500–950 | #FFFFFF |
| brand | #125183 | 50–400 | 500–900 | #FFFFFF |
| teal | #042f2e | 50–600 | 700–950 | **#042f2e** |
| rose | #4c0519 | 50–500 | 600–950 | **#4c0519** |
| purple | #3b0764 | 50–400 | 500–950 | #FFFFFF |
| amber | #451a03 | 50–600 | 700–950 | **#451a03** |

On-DEFAULT is dark for teal, rose and amber. For example, measured `text-on-primary` inside `.theme-teal` is `rgb(4,47,46)`.

**accent** (all themes): slate. The shades are #f8fafc, #f1f5f9, #e2e8f0, #cbd5e1, #94a3b8, #64748b, #475569, #334155, #1e293b, #0f172a, #020617, and DEFAULT is #1e293b.
- on-accent: #020617 for 50–400, #FFFFFF for 500–950 and for DEFAULT.

**warn** (all themes): red. The shades are #fef2f2, #fee2e2, #fecaca, #fca5a5, #f87171, #ef4444, #dc2626, #b91c1c, #991b1b, #7f1d1d, #450a0a, and DEFAULT is #dc2626.
- on-warn: #450a0a for 50–400, **#fef2f2 for 500** (override), #FFFFFF for 600–950 and for DEFAULT.

### 1.5 Scheme tokens (light / dark), measured

Scheme tokens do not depend on the theme. They depend only on the nearest `.light`/`.dark` scope.

| token (semantic) | light | dark |
|---|---|---|
| bg-app-bar | #FFFFFF | #0f172a (slate-900) |
| bg-card | #FFFFFF | #1e293b (slate-800) |
| bg-default | #f1f5f9 (slate-100) | #0f172a (slate-900) |
| bg-dialog | #FFFFFF | #1e293b |
| bg-hover | rgba(148,163,184,0.12) (slate-400 @ 12%) | rgba(255,255,255,0.05) |
| bg-status-bar | #cbd5e1 (slate-300) | #0f172a |
| text-default | #1e293b (slate-800) | #FFFFFF |
| text-secondary | #64748b (slate-500) | #94a3b8 (slate-400) |
| text-hint | #94a3b8 (slate-400) | #64748b (slate-500) |
| text-disabled | #94a3b8 (slate-400) | #475569 (slate-600) |
| border (token) | #e2e8f0 (slate-200) | rgba(241,245,249,0.12) (slate-100 @ 12%) |
| divider | #e2e8f0 | rgba(241,245,249,0.12) |
| icon | #64748b | #94a3b8 |

Important measured deviation for the **border token**: see 5.3. The effective default border color in the reference is `#e2e8f0` in **both** schemes.

Other layout tokens exist as CSS variables. Their owner is the navigation/drawer spec, not this one:

| token | value |
|---|---|
| vertical navigation width | 280px |
| vertical navigation compact width | 112px |
| vertical navigation dense width | 80px |
| vertical navigation thin width | 80px |
| drawer width | 320px |

Dead tokens: the reference also defines a second set of variables on `:root`, `.theme-light` and `.theme-dark`, named `foreground-base/divider/disabled/hint/secondary/text` and `background-base/card/dialog/hover/tooltip`. Nothing reads them. They need **not** be reproduced.

---

## 2. Utility classes that MUST keep their names

The existing templates (`src/app/**`; the feature generator templates in `src/fuse-feature/files/**` use only stock classes) depend on the classes below.
- Every color class MUST respond to the current theme and scheme scope at runtime. It MUST NOT be compiled to a fixed color.
- The reference compiles **all Tailwind utilities with `!important`**. See section 3.

### 2.1 Semantic scheme classes

| class | CSS effect | light | dark | used by app? |
|---|---|---|---|---|
| `bg-card` | background-color = bg-card token, alpha fixed 1, !important | #FFFFFF | #1e293b | yes (24 files, also via `@apply` in `shared/components/card/card.component.scss`) |
| `bg-default` | background-color = bg-default token, !important | #f1f5f9 | #0f172a | yes (horizontal layouts) |
| `bg-dialog` | background-color = bg-dialog token, !important | #FFFFFF | #1e293b | not in app; keep for components |
| `bg-hover` | background-color = bg-hover token (already semi-transparent), !important | rgba(148,163,184,.12) | rgba(255,255,255,.05) | yes (settings, user, languages, search, quick-chat) |
| `text-default` | color = text-default token, alpha 1, !important | #1e293b | #FFFFFF | not in app; used by components; keep |
| `text-secondary` | color = text-secondary token, !important | #64748b | #94a3b8 | yes (24 files) |
| `text-hint` | color = text-hint token, !important | #94a3b8 | #64748b | yes (search) |
| `text-disabled` | color = text-disabled token, !important | #94a3b8 | #475569 | keep |
| `divider` | color = divider token, !important | #e2e8f0 | rgba(241,245,249,.12) | keep |
| `ring-bg-card` | ring color (`--tw-ring-color`) = bg-card token, !important | #FFFFFF | #1e293b | yes (quick-chat avatar rings, with `ring-2`) |
| `ring-bg-default` | ring color = bg-default token | #f1f5f9 | #0f172a | keep |

Each of these MUST also work with the `dark:`, `hover:`, `sm:` and other variants. The app uses:
- `dark:bg-card`
- `dark:bg-default`
- `dark:bg-hover`
- `dark:hover:bg-hover`
- `sm:bg-card`

### 2.2 Theme palette color utilities

- The Tailwind color set MUST include these color names for every utility family (`bg-`, `text-`, `border-`, `ring-`, `ring-offset-`, `divide-`, `outline-`, `from-`/`via-`/`to-`, `fill-`, `stroke-`, `placeholder-`, `shadow-`, `accent-`, `caret-`, `decoration-`):
  - `primary`, `primary-50` … `primary-950`
  - `on-primary`, `on-primary-50` … `on-primary-950`
  - the same for `accent`, `on-accent`, `warn` and `on-warn`
- The bare name (`bg-primary`) is DEFAULT.
- Each value MUST resolve through a CSS variable of the current theme scope. It MUST accept Tailwind's opacity channel, so both `bg-primary/10` and the legacy `bg-opacity-*` style work.

Used by the app:
- background: `bg-primary`, `bg-primary-50`, `bg-primary-100`, `bg-primary-600`, `bg-primary-700`, `dark:bg-primary-500`, `dark:bg-primary-600`, `dark:bg-primary-800`
- text: `text-primary`, `text-primary-400`, `text-primary-500`, `text-primary-600`, `text-primary-700`, `text-primary-800`, `dark:text-primary-400`, `dark:text-primary-50`, `hover:text-primary`, `text-on-primary`
- border and ring: `border-primary`, `focus:border-primary`, `ring-primary`, `ring-primary-50`

The new `@ui` components may need `accent-*`, `warn-*` and `on-*` (the old components used them), so the whole set MUST be available.

Measured examples, default theme. These are the same in light and dark, because palettes are scheme-independent:
- `bg-primary`: rgb(79,70,229)
- `bg-primary-100`: rgb(224,231,255)
- `text-primary-400`: rgb(129,140,248)
- `text-on-primary`: #FFFFFF

### 2.3 `gray` alias

`gray-*` MUST equal Tailwind `slate-*`. For example, `bg-gray-100` is #f1f5f9 and `text-gray-500` is #64748b.

The app uses `gray` widely, for example:
- `bg-gray-800` and `bg-gray-900` on the dark navigation panels and on the auth page right panels;
- `text-gray-400`;
- `border-gray-200` and `border-gray-300`.

### 2.4 Icon size utilities `icon-size-{n}`

Each class sets width, height, min-width, min-height, font-size and line-height of the element to the value. It also sets width and height of any **descendant `svg`** to the value.

| class | value |
|---|---|
| icon-size-3 | 0.75rem (12px) |
| icon-size-3.5 | 0.875rem (14px) |
| icon-size-4 | 1rem (16px) |
| icon-size-4.5 | 1.125rem (18px) |
| icon-size-5 | 1.25rem (20px) |
| icon-size-6 | 1.5rem (24px) |
| icon-size-7 | 1.75rem (28px) |
| icon-size-8 | 2rem (32px) |
| icon-size-10 | 2.5rem (40px) |
| icon-size-12 | 3rem (48px) |
| icon-size-14 | 3.5rem (56px) |
| icon-size-16 | 4rem (64px) |
| icon-size-18 | 4.5rem (72px) |
| icon-size-20 | 5rem (80px) |
| icon-size-22 | 5.5rem (88px) |
| icon-size-24 | 6rem (96px) |

Used by the app:
- `icon-size-4` (3 files)
- `icon-size-5` (11 files)
- `icon-size-6` (2 files)
- `icon-size-7` (settings cog)
- `icon-size-24` (quick-chat empty state, classy)

### 2.5 Font size scale (REPLACES Tailwind's default scale)

| class | size | px at 16px root |
|---|---|---|
| text-xs | 0.625rem | 10 |
| text-sm | 0.75rem | 12 |
| text-md | 0.8125rem | 13 |
| text-base | 0.875rem | 14 |
| text-lg | 1rem | 16 |
| text-xl | 1.125rem | 18 |
| text-2xl | 1.25rem | 20 |
| text-3xl | 1.5rem | 24 |
| text-4xl | 2rem | 32 |
| text-5xl | 2.25rem | 36 |
| text-6xl | 2.5rem | 40 |
| text-7xl | 3rem | 48 |
| text-8xl | 4rem | 64 |
| text-9xl | 6rem | 96 |
| text-10xl | 8rem | 128 |

- These size classes set **only** `font-size`. They set no line-height.
- Line height comes from the inherited unitless `1.5` set on `html`. Measured: `text-lg` gives 16px/24px and `text-md` gives 13px/19.5px.
- This is a visible difference from stock Tailwind, where `text-sm` is 14px with a 20px line-height. The new setup MUST reproduce this scale exactly.
- `text-md` is non-standard and is used in 12 files.

### 2.6 Breakpoints (REPLACE Tailwind's defaults)

| prefix | min-width |
|---|---|
| sm | 600px |
| md | 960px |
| lg | 1280px |
| xl | 1440px |

There is no `2xl`. The same values are used in the Angular-side media-query config (`screens` in `app.config.ts`).

### 2.7 Extended scales (MUST exist in addition to stock Tailwind)

| family | extra keys → values | used by app |
|---|---|---|
| spacing (all padding/margin/width/height/inset/gap/translate) | 13→3.25rem, 15→3.75rem, 18→4.5rem, 22→5.5rem, 26→6.5rem, 30→7.5rem, 50→12.5rem, 90→22.5rem, 100→25rem, 120→30rem, 128→32rem, 140→35rem, 160→40rem, 180→45rem, 192→48rem, 200→50rem, 240→60rem, 256→64rem, 280→70rem, 320→80rem, 360→90rem, 400→100rem, 480→120rem, 1/2→50%, 1/3→33.333333%, 2/3→66.666667%, 1/4→25%, 2/4→50%, 3/4→75% | `w-30`, `sm:px-18`, `sm:w-90`, `sm:w-100`, `h-400` |
| min-width, max-width, min-height | the whole spacing scale above, plus `screen`→100vw (min-w and max-w) | `min-w-screen`, `min-w-4`, `min-w-60`, `sm:min-w-80/90/100`, `max-w-36/60/80`, `max-w-360`, `sm:max-w-360`, `max-w-3/4`, `min-h-6/20/400` |
| max-height | stock + `none`; the reference also resolves `max-h-128`, `sm:max-h-120`, `max-h-400` (spacing keys) | `max-h-128`, `sm:max-h-120`, `max-h-400` |
| flex | `flex-0` → `0 0 auto` | 21 files |
| opacity | 12→0.12, 38→0.38, 87→0.87 | `opacity-12` |
| z-index | -1, 49, 60, 70, 80, 90, 99, 999, 9999, 99999 | `z-49` (header bars in 10 layouts), `z-90`, `z-99`, `z-999` |
| rotate | -270→270deg, 15, 30, 60, 270 (deg) | not used |
| scale | `-scale-x-1` must give `transform: scaleX(-1)` (measured) | `-scale-x-1` (quick-chat) |
| transitionDuration | 400→400ms | `duration-400` |
| transitionTimingFunction | `drawer` → cubic-bezier(0.25, 0.8, 0.25, 1) | `ease-drawer` |
| animation | `spin-slow` → spin 3s linear infinite | `animate-spin-slow` (settings cog) |
| fontFamily | `sans` = "Inter var", then the stock Tailwind sans stack; `mono` = "IBM Plex Mono", then the stock mono stack | sans everywhere; mono not used |

### 2.8 Variants and scoping

- `dark:` is **class-based**. A `dark:` utility applies to any element that is a descendant of an element with class `dark`. In the compiled CSS this is "the element is inside `.dark`".
  - The app relies on this: every navigation panel carries `class="dark ..."` even in light mode. For example: classy, classic, compact, dense, thin, futuristic, enterprise, material, modern, centered.
- `print:` MUST exist. It is used as `print:hidden` on navigation and header bars.
- `group-hover:`, `empty:`, `even:`, `focus:` and `hover:` are stock and are used.

### 2.9 Typography plugin (`prose`, `prose-sm`)

`@tailwindcss/typography` with the `sm` and `lg` modifiers MUST stay available. It is used on the landing page (`modules/landing/home`).

Prose colors MUST follow the scheme tokens:

| prose element | color |
|---|---|
| body text, strong, h1–h4, code, thead, blockquote text | text-default |
| lead text, ordered-list markers, figcaption | text-secondary |
| bullet markers | text-hint |
| hr, blockquote left border, thead bottom border, tbody row borders | border token |
| links | primary-500 |
| code inside links | primary DEFAULT |
| pre | white text on gray-800 (#1e293b) |

- `code` font-weight is 500.
- Disable the plugin's per-`type` ordered-list styles (A/a/I/i).
- `prose-sm` uses 1em for code, pre and table font sizes.

Measured: link #6366f1; h1 30px; p 14px with `prose-sm`. The text is #1e293b in light and #FFFFFF in dark.

### 2.10 Classes in templates that have no CSS (dead)

- `fuse-mat-button-large` is used on the submit buttons of the sign-in, sign-up, forgot-password, reset-password and unlock-session pages. Nothing defines it.
- It is Fuse-named. The rewrite MUST rename or remove it. Removing it changes nothing visually.

### 2.11 Disabled Tailwind core plugins

The reference disables these core plugins: appearance, container, float, clear, placeholderColor, placeholderOpacity and verticalAlign.
- No template uses them.
- The new setup MAY keep them disabled. It MUST NOT need them.

---

## 3. Requirements for the new Tailwind setup

1. **Tailwind 3.4** (current `^3.4.17`) with PostCSS. `darkMode: 'class'`.
   - Content globs MUST cover `./src/**/*.{html,scss,ts}`. They SHOULD also cover the `@ui` folder and feature-generator output.
2. **`important: true`**: every generated utility gets `!important`. MUST keep. Many templates override PrimeNG and component styles by relying on this.
3. **Theme switching**:
   - Exactly one `theme-<id>` class sits on `<body>`. The app's layout component removes any previous `theme-*` class and adds the new one.
   - The default theme's variables MUST also apply to plain `body`, so they work when no theme class is present.
   - Theme classes MUST be **nestable**. Any element with `class="theme-teal"` re-scopes the primary/accent/warn variables for its subtree.
   - The Settings drawer needs this: each theme chip carries its own `theme-*` class and shows a `bg-primary` dot and `ring-primary` in that theme's color.
4. **Scheme switching**:
   - `<body>` carries exactly one of `light` / `dark`. The layout component sets it from config `scheme: 'light' | 'dark' | 'auto'`. `auto` uses `prefers-color-scheme`.
   - Scheme tokens MUST be scoped by the classes `.light` and `.dark` on **any** element, and nested scopes MUST win:
     - `.dark .light` gives light tokens again;
     - `.light .dark` gives dark tokens.
     Measured: inside a `.dark` panel in a light body, `text-secondary` is #94a3b8. Inside a `.light` nested in it, it is back to #64748b.
   - Every element with class `light` or `dark`, and `body` itself, MUST get `color: text-default` and `background-color: bg-default` of its scheme, with !important. A utility class on the same element still wins, because utilities come later and are also !important. Example: `class="dark bg-gray-900"` gives #0f172a, and `dark bg-indigo-800` gives indigo-800.
   - The PrimeNG theme service separately toggles `dark` on `<html>`. See section 4.
5. **CSS variables to expose**. The names are free; a neutral prefix such as `--ui-` is recommended. Nothing in `src/app/**` or the generator templates reads `--fuse-*` directly. The only reference is the inert bridge in `src/styles/styles.scss` (section 4).
   - Per theme scope:
     - `primary-{50..950}`, `primary` (DEFAULT), `on-primary-{50..950}` and `on-primary`;
     - the same for `accent` and `warn`;
     - each as a hex color **and** as an `r,g,b` triplet variant, so Tailwind can apply `<alpha-value>`.
   - Per scheme scope:
     - `bg-app-bar`, `bg-card`, `bg-default`, `bg-dialog`, `bg-hover`, `bg-status-bar`;
     - `text-default`, `text-secondary`, `text-hint`, `text-disabled`;
     - `border`, `divider`, `icon`;
     - each also with an `r,g,b` triplet variant. For the rgba tokens (`bg-hover`, dark `border`/`divider`), the triplet is the color without its alpha.
   - The SHOULD-level light-scheme flag variable (`--is-dark: false` in light, unset in dark) is unused and MAY be dropped.
6. **Build-time generation**. Palettes are computed in the Tailwind config (Node), using the algorithms in 1.2 and 1.3.
   - The reference also writes an SCSS map file at build time. This is **not** required, and the build SHOULD NOT write into `src/`.
   - The color math can use any library (for example chroma-js 2.4, already a dependency) or a self-written WCAG/linear-RGB implementation. Section 1.4 is the test oracle.
7. **Single emission**. The reference emits Tailwind's base layer twice, components twice and utilities twice, from three stylesheet entries. The new setup SHOULD emit each layer once. It MUST still produce the effective values in section 5. Section 5.3 lists the cases where the double preflight changes the result.
8. Plugins to keep: `@tailwindcss/typography`. The icon-size, semantic-class and theming plugins are re-implemented under `src/@ui/tailwind/`.

---

## 4. PrimeNG bridge

The owner's code, which stays: `src/app/core/primeng/fuse-primeng.preset.ts` and `primeng-theme.service.ts`. These SHOULD be renamed to drop "fuse" (for example `app-primeng.preset.ts` and the `AppPrimePreset` symbol), but their content is the owner's.

**What the preset reads:**
- **No CSS variables.** It is a static `definePreset(Aura, …)`.
- `primary` 50–950 = indigo (the values are identical to the default theme's primary row).
- light scheme:
  - `primary.color` = indigo-600, hover = indigo-700, active = indigo-800, contrast = #ffffff;
  - surface 0–950 = white + slate.
- dark scheme:
  - `primary.color` = indigo-500, hover = indigo-400, active = indigo-300;
  - surface = zinc-like greys (50 #18181b … 950 #ffffff).
- The button `primary` tokens map to `{primary.*}`.

**Config (`app.config.ts`):** `providePrimeNG({ ripple: true, theme: { preset, options: { prefix: 'p', darkModeSelector: 'html.dark', cssLayer: false } } })`.

**Theme service:** it listens to the app config `scheme` and toggles class `dark` on `<html>`. For `auto` it reads `matchMedia('(prefers-color-scheme: dark)')` once per config change. It depends on the config service. The new `@ui` config service MUST expose the same `config$` stream with a `scheme` field.

**Bridge in `src/styles/styles.scss` (measured inert):**
- It sets `--p-primary-50 … 950` on `html` to `rgb(var(--fuse-primary-N))`. It has no effect, for two reasons:
  1. The theme variables are hex, so `rgb(#hex)` is invalid.
  2. PrimeNG's own `:root,:host{--p-…}` rule has higher specificity than `html`.
- The file also sets:
  - `color-scheme: light` on `:root`;
  - `color-scheme: dark` on `html.dark`;
  - `color-scheme: dark` on `html.dark .p-component`.

**Measured effective PrimeNG look (MUST stay unless the owner decides otherwise):**
- PrimeNG primary is always indigo. `--p-primary-color` is #4f46e5 and the hover color is #4338ca, **whatever `theme-*` class is active**.
- PrimeNG renders with its **light** tokens even when `html.dark` is set:
  - `--p-content-background` #ffffff, `--p-text-color` #334155;
  - form fields: white background, border #cbd5e1, 6px radius, 42px height, 16px font;
  - `--p-highlight-background` #eef2ff.
- Cause: PrimeNG emits its dark tokens nested as `html.dark { :root,:host { … } }`, which can never match.
- Visible result: in dark mode, the sign-in page inputs stay white.
- The new theming MUST NOT change this as a side effect. See open questions Q1 and Q2.

If the owner later wants PrimeNG to follow the theme, the new theming SHOULD make it possible with no code change in the preset. To do that, expose the theme primary shades as plain hex variables that the owner can point `--p-primary-*` at, using a selector stronger than `:root`.

---

## 5. Global base styles

### 5.1 Typography and root

| item | value (measured) |
|---|---|
| html font-size | 16px (print: 12px !important) |
| body font-size | 0.875rem = 14px |
| line-height | 1.5 unitless on html → body 21px |
| font-family | "Inter var", ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji" |
| body font-feature-settings | "salt" (Inter stylistic alternates: single-storey "a" and others; very visible) |
| text-rendering (all elements) | optimizeLegibility |
| -webkit-font-smoothing / -moz-osx-font-smoothing on html and body | auto |
| -webkit-tap-highlight-color | transparent |
| focus outline | `outline: none !important` on every focused element. Measured: outline-style none |
| html, body layout | display flex; flex-direction column; flex 1 1 auto; width 100%; min-height 100%; body margin 0 |
| body color / background | text-default / bg-default of the scheme (light #1e293b on #f1f5f9; dark #FFFFFF on #0f172a) |

- **Inter font**: self-hosted variable font. The family name is `Inter var`, weight range 100–900, `font-display: swap`. It has two faces:
  - normal, from `assets/fonts/inter/Inter-roman.var.woff2`;
  - italic, from `Inter-italic.var.woff2`.
  - Version 3.18. The URL carries the cache-buster `?v=3.18`.
- **IBM Plex Mono**: loaded from Google Fonts in `index.html` (weights 400, 500, 600 and italic 400). It is only used by `font-mono`, which no template uses. The link SHOULD stay, so code blocks inside `prose` look the same, or it MAY be dropped (Q4).
- **Material Icons** (Google Fonts) is linked in `index.html` but unused (there is no `mat-icon` or `material-icons` class). It SHOULD be removed.

### 5.2 Element defaults (measured)

| element | effective style |
|---|---|
| `img` | width 100% of its container, display block, vertical-align middle, max-width 100%, height auto. Templates size images with `w-*` classes. |
| `hr` | margin 0, height 0; **1px top and 1px bottom border** in the default border color (a 2px line in total). The templates add `my-8`, `my-2` and so on. |
| `input`, `textarea` | transparent background (except PrimeNG inputs, which have their own) |
| `input[disabled]` | opacity 1; text fill color = currentColor (stops Safari fading) |
| descendants of any `[disabled]` element | color = text-disabled, !important (light #94a3b8) |
| default border color (`*`, `::before`, `::after`) | **#e2e8f0 in both schemes**. See 5.3. |

### 5.3 Effective-vs-intended differences (keep the effective values)

The reference loads Tailwind's preflight a second time after its own base rules. The second preflight overrides three of them:

| item | intended in source | effective (measured, MUST reproduce) |
|---|---|---|
| default border color | border token: #e2e8f0 light, rgba(241,245,249,.12) in dark (opacity forced to 0.12 under `.dark`) | #e2e8f0 (slate-200) in light **and** dark. Visible in `dark-classy.png`: light row separators in dark cards and a light header bottom line. |
| hr margin | 32px top and bottom | 0 |
| input placeholder color | text-hint (#94a3b8 light, #64748b dark) | #94a3b8 in both schemes |

Q3 asks the owner whether to keep these or switch to the intended values.

### 5.4 Scrollbars

**Native scrollbars.**
- These apply only when the viewport is at least 960px wide **and** body does not have class `os-mac`. On macOS and iOS the OS scrollbars are untouched.
- The app adds an OS class to body: `os-mac`, `os-windows`, `os-linux` or `os-unix`. It SHOULD drop the `fuse-` naming of the related service; the class names themselves are not Fuse-branded.
- WebKit scrollbar look:
  - 8px wide and 8px tall;
  - the track is transparent, and turns rgba(0,0,0,0.06) on hover;
  - the thumb is a rounded pill (radius 20px) with a 2px transparent border, painted as inset color rgba(0,0,0,0.24), and rgba(0,0,0,0.37) while active (dragging);
  - when body has `dark`, the thumb is rgba(255,255,255,0.24), and rgba(255,255,255,0.37) while active.

**Custom scroll containers.**
- The old perfect-scrollbar overrides gave this look:
  - the rails are 14px thick, have a transparent background and no transition, and sit at z-index 99999;
  - the y rail is pinned right;
  - rails are visible while hovering, focused or scrolling;
  - the thumb is 6px thick, rgba(0,0,0,0.5), with a 1px rgba(255,255,255,0.15) ring;
  - the thumb grows to 10px when its rail is hovered, focused or dragged, animating thickness over 225ms with cubic-bezier(0.25,0.8,0.25,1).
- If the new `@ui` scrollbar directive keeps a custom scrollbar, it MUST match this look. If it uses native scrolling, the native rules above apply. Decided in the directives spec.

### 5.5 Form and input tweaks (visual effect only)

- Native inputs and textareas have no background of their own. They show the surface behind them.
- The placeholder is hint-colored. The effective value is #94a3b8 (see 5.3).
- Browser autofill MUST NOT paint the yellow or blue autofill background. The field keeps its own (transparent) background; this is done by delaying the autofill background transition indefinitely.
- In dark scheme, autofilled text MUST stay light: white at 87% opacity.
- Elements marked `[data-autocompleted]` inside inputs get a transparent background.

### 5.6 Print

- Root font-size drops to 12px (!important), so everything scales down.
- `body`, `.dark` and `.light` lose their background (`background: none !important`). The page prints on white paper.
- Navigation and header bars carry `print:hidden`.

### 5.7 Splash screen

- **Markup**: a custom element placed in `index.html` directly before `<app-root>`. It contains the app logo `<img>` and a spinner made of three dots.
- **Naming**: rename the element and classes to non-Fuse names, for example:
  - element `<ui-splash-screen>`;
  - body class `ui-splash-screen-hidden`;
  - keyframes `ui-bounce-delay`.
- **Look**:
  - fixed full-viewport overlay (top, right, bottom and left 0), z-index 999999, pointer-events none;
  - content is a centered column;
  - background #111827 (Tailwind gray-900, not slate) and text color #F9FAFB;
  - the logo is 120px wide (max-width 120px);
  - the spinner row is 40px below the logo and 56px wide. It holds three 12px circular dots, color #1E96F7, evenly spaced (space-between).
- **Animation**:
  - each dot scales 0 → 1 → 0, with peak scale 1 at 40% of the cycle and 0 at 0%, 80% and 100%;
  - duration 1s, ease-in-out, infinite, fill mode both;
  - dot 1 starts at -0.32s, dot 2 at -0.16s and dot 3 at 0s, which gives a left-to-right ripple.
- **Behavior**:
  - while the splash is visible (body lacks the hidden class), body has `overflow: hidden`;
  - on the router's **first NavigationEnd**, a root service adds the hidden class to body;
  - the overlay then fades to opacity 0 over 400ms with cubic-bezier(0.4, 0, 0.2, 1) and becomes `visibility: hidden`;
  - the service also exposes `show()` (remove the class) and `hide()` (add the class).
  - Measured: about 100ms after DOMContentLoaded the class is present, and opacity reaches 0 within about 400ms.
- The splash CSS MUST be a plain global stylesheet loaded before the app bundle, from the angular.json `styles` array, so it renders before Angular boots.

### 5.8 `index.html`

These MUST change:
- `<title>`: currently "Fuse Angular - Angular Template and Starter Kit".
- The meta description and keywords: they mention Fuse and "Admin Template and Starter Kit with … Angular Material…".
- The splash `alt` text: currently "Fuse logo".

These are kept:
- viewport meta: width=device-width, height=device-height, initial-scale=1, minimum-scale=1;
- `<base href="/">`;
- the two PNG favicons (16 and 32), replaced with new art;
- preconnect to fonts.gstatic.com and the IBM Plex Mono stylesheet (see 5.1).

### 5.9 `angular.json` styles array

Current order (build):
1. `src/assets/fonts/inter/inter.css`
2. `src/assets/styles/splash-screen.css`
3. `node_modules/primeicons/primeicons.css`
4. `src/@fuse/styles/tailwind.scss` (preflight + base tweaks + components)
5. `src/@fuse/styles/themes.scss` (dead tokens)
6. `src/styles/vendors.scss` (perfect-scrollbar CSS)
7. `src/@fuse/styles/main.scss` (input tweaks + perfect-scrollbar overrides)
8. `src/styles/styles.scss` (all three Tailwind layers again + PrimeNG color-scheme + inert bridge)
9. `src/styles/tailwind.scss` (utilities again)

The test target has `primeicons.css` and `styles.scss`.

The new order MUST keep:
- fonts and splash first;
- primeicons before the app styles;
- the `@ui` base/theme stylesheet before `src/styles/styles.scss`, so user styles override `@ui`;
- utilities last.

`src/styles/prime.scss` (a primeicons import) is not referenced and MAY be deleted.

---

## 6. Assets audit

Root: `src/fuse-starter/files/src/`.

| path | count / size | classification | notes / action |
|---|---|---|---|
| `favicon-16x16.png`, `favicon-32x32.png` | 2 | **(a) Fuse-branded**: the Fuse blue diamond logo | MUST replace |
| `assets/images/logo/logo.svg` | 1 (32×32) | **(a)** Fuse logo mark (blue diamond, fills #2196F3/#1878C6/#1565C0/#10519D) | MUST replace. Used in index.html splash, auth pages, landing, classy/compact/dense/thin/centered/modern layouts |
| `assets/images/logo/logo-text.svg` | 1 (96×32) | **(a)** Fuse mark + "FUSE" wordmark (dark text #3F414B) | MUST replace. Used in classic/centered/material/modern |
| `assets/images/logo/logo-text-on-dark.svg` | 1 | **(a)** Fuse mark + "FUSE" wordmark for dark backgrounds | MUST replace. Used in all 10 layouts (classy shows it faded under the nav) |
| `assets/images/avatars/brian-hughes.jpg` | 1 (128×128) | **(a)** Fuse demo user portrait | MUST replace. Used by `mock-api/common/user/data.ts` and `mock-api/apps/chat/data.ts` |
| `assets/images/avatars/female-01…20.jpg`, `male-01…20.jpg` | 40 (128×128) | **(a)** Fuse demo avatar photos (stock portraits bundled with Fuse; no transferable license) | MUST replace, or drop and use initials or a generic SVG placeholder. Used by chat, messages and notifications mock data, and by the auth pages' "joined us" avatar row (female-18, female-11, male-09, male-16) |
| `assets/images/ui/angular-material/scenes/*.scene.png` | 36 (360×200) | **(b)** probably Angular Material documentation scene art (angular/components, MIT), bundled by Fuse | **Unused** by any file. SHOULD delete |
| `assets/images/flags/US.svg`, `TR.svg` | 2 | **(b)** Flagpack (Yummygum `flagpack-core`, "m" size), MIT | Keep and add the MIT notice. Used by the languages switcher (`assets/images/flags/<CODE>.svg`) |
| `assets/images/flags/where-to-find-other-flags.txt` | 1 | (a) Fuse-written note | Replace with an owner-written note or delete |
| `assets/icons/heroicons-outline.svg`, `heroicons-solid.svg`, `heroicons-mini.svg` | 3 (≈150–180 KB each) | **(b)** Heroicons v2 (Tailwind Labs), MIT, packed as sprites | Keep; SHOULD regenerate from the `heroicons` npm package with an owner script, and add the MIT notice. Used: `heroicons_outline` 60×, `heroicons_solid` 30×, `heroicons_mini` 7× |
| `assets/icons/feather.svg` | 1 (148 KB) | **(b)** Feather Icons (Cole Bemis), MIT | Keep. Used only for `feather:facebook`, `feather:twitter` and `feather:github` (sign-in social buttons) |
| `assets/icons/material-outline.svg`, `material-solid.svg`, `material-twotone.svg` | 3 (≈2.3 MB total) | **(b)** Google Material Design Icons, Apache-2.0 | **Unused** (no `mat_outline:`, `mat_solid:` or `mat_twotone:` reference). SHOULD delete, or keep with the Apache notice |
| `assets/fonts/inter/Inter-roman.var.woff2`, `Inter-italic.var.woff2` | 2 (≈230–245 KB) | **(b)** Inter 3.18 by Rasmus Andersson, SIL OFL 1.1 | Keep; add the OFL license text |
| `assets/fonts/inter/inter.css` | 1 | Fuse-shipped but trivial (two standard `@font-face` rules) | Re-create from 5.1 |
| `assets/styles/splash-screen.css` | 1 | **(a)** Fuse-derived code | Rewrite from 5.7 |
| `assets/i18n/en.json`, `tr.json` | 2 (3 keys each: "welcome-back", "Project", "Analytics") | Fuse demo keys, trivial; the Turkish values are likely the owner's | SHOULD be replaced by the owner's keys; no protectable content |
| `assets/.gitkeep` | 1 | neutral | keep |
| `_redirects` | 1 | (c) neutral one-line SPA rewrite (`/* /index.html 200`) | keep |
| *missing* `assets/images/cards/*.jpg` | referenced 12× in `mock-api/apps/chat/data.ts` | (a) Fuse demo images, not present in the repo (broken references) | remove the references with the mock data |

No asset was identified as clearly **(c) owner's own** except `_redirects` and possibly the `tr.json` translations.

### 6.1 Fuse marketing and branding text in templates and data

All paths are relative to `src/fuse-starter/files/src/`.

| text | occurrences |
|---|---|
| "Fuse Angular - Angular Template and Starter Kit" (title); meta description "Admin Template and Starter Kit with Angular, Angular Material Components and TailwindCSS"; keywords "Fuse,HTML,CSS,Angular,…Admin Template,Admin Starter Kit"; `alt="Fuse logo"` | `index.html` lines 4, 8–11, 49 |
| "Fuse &copy; {{currentYear}}" (footer) | `app/layout/layouts/horizontal/enterprise/enterprise.component.html:98`, `horizontal/centered/centered.component.html:91`, `horizontal/modern/modern.component.html:91`, `horizontal/material/material.component.html:94`, `vertical/compact/compact.component.html:67`, `vertical/classic/classic.component.html:72`, `vertical/dense/dense.component.html:77`, `vertical/futuristic/futuristic.component.html:79`, `vertical/classy/classy.component.html:99`, `vertical/thin/thin.component.html:67` |
| "You are browsing **Fuse Demo**. Click on the "Sign in" button to access the Demo and Documentation." | `app/modules/auth/sign-in/sign-in.component.html:25` |
| "Welcome to / our community" (hero heading) | `app/modules/auth/sign-in/sign-in.component.html:198–199`, `sign-up/sign-up.component.html:194–195`, `forgot-password/forgot-password.component.html:113–114`, `reset-password/reset-password.component.html:154–155`, `unlock-session/unlock-session.component.html:127–128`, `confirmation-required/confirmation-required.component.html:50–51` |
| "Fuse helps developers to build organized and well coded dashboards full of beautiful and rich modules. Join us and start building your application today." | same six auth files, lines 202–203, 198–199, 117–118, 158–159, 131–132 and 54–55 respectively |
| "More than 17k people joined us, it's your turn" (with the four demo avatars) | same six auth files, lines 220, 216, 135, 176, 149 and 72 respectively |
| Decorative auth-panel art (two large ring circles + a 4px dot grid, gray-700 on gray-800) | the same six auth files, the right-hand panel. Fuse design; the auth-pages spec should restyle it |
| Landing page copy ("Landing Module", "This can be the landing or the welcome page of your application…", "This is a separate "module"…", "Launch the App") | `app/modules/landing/home/home.component.html:8–16, 24` (Fuse demo text) |
| Demo identity "Brian Hughes" / `hughes.brian@company.com` / password `admin`; JWT issuer `'Fuse'` | `app/mock-api/common/user/data.ts:4–6`, `app/mock-api/common/auth/api.ts:70, 143, 213` (the mock login also depends on them; coordinate with the auth/mock spec) |
| Shortcuts "Changelog" (`/docs/changelog`) and "Documentation" | `app/mock-api/common/shortcuts/data.ts:5–13` (Fuse docs links) |
| i18n | `assets/i18n/en.json`, `tr.json`: no Fuse text (only "Welcome back", "Project", "Analytics") |

Fuse-named technical identifiers this unit touches, all to be renamed:
- CSS variables `--fuse-*`;
- the `fuse-splash-screen` element and the `fuse-splash-screen-hidden` class;
- the `fuse-bouncedelay` keyframes;
- the `fuse-mat-button-large` class;
- the `fuse-version` attribute on the root element (set by the layout component);
- the `FusePrimePreset` symbol and the `fuse-primeng.preset.ts` file name.

---

## 7. Acceptance checklist

Run against the rebuilt starter at 1440×900 and at 375 wide, comparing with the reference screenshots (`dark-classy.png`, `settings-open.png`, `layout-*.png`, `auth-*.png`).

Tokens and themes
- [ ] With `body.light.theme-default`, the computed body background is rgb(241,245,249) and the color is rgb(30,41,59). With `body.dark`, they are rgb(15,23,42) and rgb(255,255,255).
- [ ] For each of the 6 themes, `bg-primary-{50..900}` and `text-on-primary-{50..900}` compute exactly to the 1.4 tables. Spot-check: brand 50 = #eff5fe, teal on-DEFAULT = #042f2e, rose DEFAULT = #f43f5e, amber on-600 = #451a03.
- [ ] `accent` and `warn` are identical in all themes; `on-warn-500` = #fef2f2.
- [ ] The brand palette is produced by the generator from `#2196F3`, not hard-coded, and matches 1.4.
- [ ] A `.theme-teal` element inside a `theme-default` body renders `bg-primary` as #0d9488. The Settings theme chips show six differently colored dots.
- [ ] A `.dark` element inside a light body gives `text-secondary` #94a3b8, `bg-hover` rgba(255,255,255,0.05), and `dark:` variants active. A `.light` element nested inside it gives #64748b again.

Utility classes
- [ ] Every class in 2.1, 2.2 (used list), 2.4 (used sizes), 2.5, 2.6 and 2.7 (used column) produces the stated value. Use a probe page that renders each class in light and dark.
- [ ] `text-sm` is 12px, `text-md` 13px, `text-base` 14px; none of them sets a line-height.
- [ ] `icon-size-5` gives a 20×20 box with font-size 20px, and an inner `svg` of 20×20.
- [ ] `-scale-x-1` gives scaleX(-1); `flex-0` gives `0 0 auto`; `ease-drawer` and `duration-400` work; `animate-spin-slow` spins in 3s.
- [ ] Utilities are `!important`.
- [ ] `prose prose-sm` on the landing page: links #6366f1, text follows the scheme.

Base styles
- [ ] html 16px, body 14px with line-height 21px, Inter var with "salt", no focus outlines.
- [ ] Borders default to #e2e8f0 in both schemes (unless Q3 changes it); `hr` is 2px with margin 0; placeholders #94a3b8.
- [ ] `img` defaults to width 100%.
- [ ] Children of `[disabled]` are #94a3b8 (light).
- [ ] On non-mac at ≥960px, the scrollbar is 8px with a pill thumb, black 24% (white 24% in dark).
- [ ] Print preview: 12px root, no page background, nav hidden.
- [ ] Splash: dark #111827 overlay, 120px logo, three 12px #1E96F7 dots pulsing in sequence. It fades out over 400ms after the first navigation; body scrolling is locked while it shows.

PrimeNG
- [ ] PrimeNG button and input colors are unchanged in all themes and schemes (indigo #4f46e5, white inputs with #cbd5e1 border), unless the owner resolves Q1/Q2.
- [ ] `html.dark` is still toggled by the PrimeNG theme service when the scheme changes.

Branding
- [ ] No file under `src/` (starter) contains "Fuse", "FUSE" or "fuse-" in user-visible text, asset names or CSS identifiers, except third-party license files.
- [ ] Logos, favicons and all avatars are replaced; unused material sprites and Angular Material scene PNGs are removed.
- [ ] License notices are present for Inter (OFL-1.1), Heroicons (MIT), Feather (MIT) and Flagpack (MIT), plus Material Icons (Apache-2.0) if kept.
- [ ] Visual diff against the reference screenshots shows only the intended logo, avatar and text changes.

---

## 8. Open questions for the owner

- **Q1. PrimeNG dark mode is currently broken.** The dark tokens never apply, so in dark mode PrimeNG inputs, cards and tables stay light. Keep the current look (the default of this spec), or fix it?
  - A possible fix, owner's code: change `darkModeSelector` to a plain class selector that PrimeNG emits correctly, then verify.
  - Fixing it changes the dark-mode visuals.
- **Q2. PrimeNG ignores the selected theme**: it is always indigo. Should PrimeNG primary follow `theme-*`? If yes, the bridge in `src/styles/styles.scss` must be rewritten to use valid values and a selector stronger than `:root`. The current bridge does nothing and SHOULD be deleted or fixed.
- **Q3. Dark-mode borders, hr margin and placeholder color**: keep the effective values (light slate-200 borders in dark, as seen in `dark-classy.png`), or adopt the intended values (borders and dividers at slate-100 12% in dark, hr margin 32px, scheme-aware placeholder)? The default of this spec is to keep the effective values.
- **Q4.** Drop the unused Google Fonts links (Material Icons, IBM Plex Mono)? Material Icons is clearly unused. IBM Plex Mono only matters if `font-mono` is used later.
- **Q5.** Global `outline: none !important` on focus removes all keyboard focus indication, including PrimeNG's. Keep it for visual parity, or allow `:focus-visible` rings (accessibility)?
- **Q6.** Replacement art: what new logo mark, wordmark and favicon should be used? What should the splash spinner color `#1E96F7` and the brand theme base `#2196F3` become? They currently match the Fuse logo blue. Should "brand" be renamed or re-based on the owner's brand color?
- **Q7.** Avatars: use generated initials avatars, neutral SVG silhouettes, or license-free photos (for example from a CC0 source) for the mock data and the auth "joined us" row?
