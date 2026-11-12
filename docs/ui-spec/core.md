# `@ui` core: functional specification

Scope: the core building blocks of the starter template at `src/fuse-starter/files`, apart from navigation and global styling, which are specified separately. The new code lives in `src/@ui/`. This document describes **what** each unit must do and **how it looks**. It is not a description of any prior implementation.

## 0. Conventions for all units

- **Location and naming.** The code goes in `src/@ui/<area>/<unit>/`, with a barrel at `src/@ui/index.ts` and a tsconfig path alias `@ui/*` (and `@ui`). Selectors use the `ui-` prefix and classes use the `Ui` prefix. CSS classes emitted by `@ui` components use the `ui-` prefix.
- **Angular style.** Everything is standalone, uses `ChangeDetectionStrategy.OnPush`, and works with zoneless change detection (`provideZonelessChangeDetection()` is already on). Use signal APIs: `input()`, `model()`, `output()`, `computed()`, `effect()`, `viewChild()`. Use `inject()` and never constructor parameters. No `markForCheck()` calls should be needed. No `setTimeout()` should be needed to dodge "expression changed" errors.
- **Libraries.** PrimeNG 20 and Tailwind 3 are available. Do **not** add dependencies on `lodash-es` or `perfect-scrollbar` (see the scrollbar section), or on `@angular/animations` for new code (see the animations section).
- **Observables.** Where an existing call site uses an Observable (`config$`, `onMediaChange$`, `onClose`), the new service may also expose an Observable built with `toObservable()`. That keeps migration mechanical. The signal is the source of truth.
- **Colors.** Colors are named as Tailwind palette tokens. `primary-*`, `accent-*` and `warn-*` are the theme palettes (CSS variables owned by the styling spec). In the default theme, `primary` is indigo (`primary-600` = `#4F46E5`, rgb 79 70 229) and `warn` is red. `gray-*` resolves to the **slate** palette in this project (for example, `gray-50` = rgb 248 250 252). "Dark" means the `dark` class is present (see the config section).
- **Measurements.** Every measurement marked *(measured)* was taken from the running reference app at 1440×900, light scheme, default theme.

---

## 1. Icon: `ui-icon`

### Purpose
Renders one icon from an SVG sprite file (the `namespace:name` convention) or from an icon-font class such as PrimeIcons `pi pi-expand`. It is the single most-used primitive: 75 usages in `app/**`, plus the navigation components and the internals of the alert and fullscreen units.

### Proposed API
```ts
// src/@ui/components/icon/ui-icon.component.ts
@Component({ selector: 'ui-icon', /* standalone, OnPush */ })
export class UiIconComponent {
  /** Sprite icon as 'namespace:name'. With no namespace, 'heroicons_outline' is assumed. */
  readonly svgIcon = input<string | null | undefined>(null);
  /** Font-icon class list, e.g. 'pi pi-expand'. Used only when svgIcon is empty. */
  readonly icon = input<string | null | undefined>(null);
  /** Optional accessible label. When set, the icon is exposed as an image; otherwise it is decorative. */
  readonly label = input<string | null>(null);

  /** Resolved sprite URL, e.g. 'assets/icons/heroicons-outline.svg#chart-pie' (null when not an svg icon). */
  protected readonly href: Signal<string | null>;
}

/** Base path of the sprite files. Default 'assets/icons/'. */
export const UI_ICONS_PATH = new InjectionToken<string>('UI_ICONS_PATH');
/** Optional mapping namespace -> file name (without path). Default rule: underscores become hyphens + '.svg'. */
export const UI_ICON_NAMESPACES = new InjectionToken<Record<string, string>>('UI_ICON_NAMESPACES');
```

### Behavior
- **Parsing `svgIcon`.** Split at the first `:`. The left part is the namespace and the right part is the symbol id. If there is no `:` (or the namespace part is empty), the namespace is `heroicons_outline` and the whole string is the id.
- **Namespace to file.** Look the namespace up in `UI_ICON_NAMESPACES`. If it is not there, use `namespace.replaceAll('_','-') + '.svg'`. The final URL is `UI_ICONS_PATH + file + '#' + id`. Keep the path **relative** (no leading slash) so that it respects `<base href>`.
- **Rendering.** An svg icon renders as one inline `<svg>` that contains `<use href="…">`. A font icon renders as one `<span>` that carries the given classes. If both inputs are empty, nothing renders: the host stays, but it is empty and has zero size.
- When an input changes, the output updates reactively (the inputs are signals and `href` is `computed`).
- The browser fetches each sprite file once and caches it. Icons from one namespace share that file.

### Sprite files (`src/assets/icons/`, kept as they are)
| namespace | file | symbols | format |
|---|---|---|---|
| `heroicons_outline` | `heroicons-outline.svg` | 292 | nested `<svg id>` in `<defs>`, 24×24, `fill="none"`, `stroke="currentColor"`, stroke-width 1.5 |
| `heroicons_solid` | `heroicons-solid.svg` | 292 | nested `<svg id>`, 24×24, `fill="currentColor"` |
| `heroicons_mini` | `heroicons-mini.svg` | 292 | nested `<svg id>`, 20×20, `fill="currentColor"` |
| `feather` | `feather.svg` | ~280 | nested `<svg id>` (24×24 viewBox) |
| `material_outline` | `material-outline.svg` | 1792 | `<symbol id>` 24×24 |
| `material_solid` | `material-solid.svg` | 1792 | `<symbol id>` |
| `material_twotone` | `material-twotone.svg` | 1792 | `<symbol id>` |

Both formats work with `<use href="file#id">`. Only the heroicons and feather namespaces are used today. The material sprites are 0.7 to 0.9 MB each, but they are only downloaded when one of their icons is used.

Icon names in use after the removals: `heroicons_outline:` `bars-3`, `arrows-right-left`, `x-mark`, `magnifying-glass`, `user-circle`, `check-circle`, `cog-8-tooth`, `ellipsis-horizontal-circle`, `chevron-up`, `chevron-down`, `arrow-right-on-rectangle`, `bell`, `chart-pie` (navigation data), `exclamation-triangle` (confirmation default); `heroicons_solid:` `cog-8-tooth`, `bolt`, `moon`, `sun`, `x-mark`, `envelope-open`, `eye`, `eye-slash`, `user-circle`, `chevron-right` (navigation collapsable arrow); `heroicons_mini:arrow-long-right`; `feather:` `facebook`, `twitter`, `github`. Some names come from data, such as navigation items and notifications, so any id in the sprites must work.

### Visual spec
- **Host.** `display: inline-flex`, items and content centered, `line-height: 1`. *(measured)* By default the host computes to **24×24 px**.
- **Default glyph size.** 1.5rem (24 px) square. The inner `<svg>` or `<span>` fills the host's box: inner width and height are 100% of the host, and the font icon uses `font-size` equal to the host size. This lets size utilities on the host resize the glyph, both svg and font.
- **Color.** The svg uses `fill: currentColor; stroke: currentColor`. The sprite's own `fill="none"` on outline icons still wins, so outline icons stay outlined. A font icon inherits `color`. The icon therefore always takes the text color of its context. For example, *(measured)* in the classy toolbar the icons are `primary-600`, and in the dark navigation they are white.
- **Size utilities (keep them).** `icon-size-{3,3.5,4,4.5,5,6,7,8,10,12,14,16,18,20,22,24}` map to 0.75, 0.875, 1, 1.125, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5 and 6 rem. On the element they set width, height, min-width, min-height, font-size and line-height, and they also size a nested `svg`. The styling spec owns the utility itself. `ui-icon` must respect it. Sizes in use: 4, 5, 6, 7, 24, and the 6 default.
- `ui-icon` must not set its own color or margin, so that utilities such as `mr-3`, `text-secondary`, `text-current`, `absolute` and `opacity-0` on the host keep working.

### States
Empty (renders nothing); svg; font. There are no interactive states.

### Accessibility
- Without `label`: the `<svg>` or `<span>` has `aria-hidden="true"` and `focusable="false"` (svg). Icons inside buttons rely on the button's own `aria-label` or `pTooltip`.
- With `label`: the host gets `role="img"` and `aria-label`.

### Call sites
- `app/layout/layouts/**` (10 layouts): the navigation toggle `bars-3`; dense also uses `arrows-right-left`; classy uses an avatar fallback `heroicons_solid:user-circle` at `icon-size-24`. The `chat-bubble-left-right` button for quick-chat goes away with quick-chat.
- `app/layout/common/settings`: cog (`icon-size-5 text-white animate-spin-slow`, and `icon-size-7`), close `x-mark`, `bolt`, `moon` and `sun` (`icon-size-5`).
- `app/layout/common/notifications`, `search` and `user`: see the names above. They use `icon-size-4`, `icon-size-5` and `icon-size-6`, together with `mr-3`, `absolute`, `text-secondary`, `text-primary dark:text-primary-400` and `text-hint`.
- `app/modules/auth/{sign-in,sign-up,reset-password,unlock-session}`: the password eye toggle (`icon-size-5`, with a name bound to state); sign-in also has the social icons from `feather`.
- `app/modules/landing/home`: `heroicons_mini:arrow-long-right` with `ml-2 icon-size-5`.
- Navigation (separate spec): item icons with per-item extra classes, and the collapsable chevron at `icon-size-4`.
- Inside `ui-alert` and `ui-fullscreen`: font icons (PrimeIcons).
- Removed with their widgets: `messages`, `shortcuts`, `quick-chat`.

### Acceptance checklist
- [ ] `<ui-icon svgIcon="heroicons_outline:chart-pie">` renders `<svg><use href="assets/icons/heroicons-outline.svg#chart-pie">` at 24×24.
- [ ] `svgIcon="bell"` resolves to the `heroicons_outline` namespace.
- [ ] `heroicons_mini:x` resolves to `heroicons-mini.svg`, and `feather:github` resolves to `feather.svg`.
- [ ] `<ui-icon icon="pi pi-expand">` renders a 24 px font glyph.
- [ ] `class="icon-size-5"` gives a 20×20 host **and** glyph, for both svg and font icons.
- [ ] The color follows `currentColor`, and outline icons are not filled.
- [ ] Changing `svgIcon` at runtime (for example, the eye/eye-slash toggle) swaps the glyph without re-creating the host.
- [ ] Icons are decorative (`aria-hidden`) unless `label` is set.
- [ ] Icons work under a non-root `<base href>`.

---

## 2. Loading bar: `ui-loading-bar`, `UiLoadingService`, `uiLoadingInterceptor`

### Purpose
A thin progress bar fixed to the top of the viewport. It shows automatically while HTTP requests are in flight (auto mode), and code can also drive it by hand (manual show, hide and progress).

### Proposed API
```ts
// src/@ui/services/loading/ui-loading.service.ts
export type UiLoadingMode = 'determinate' | 'indeterminate';

@Injectable({ providedIn: 'root' })
export class UiLoadingService {
  readonly auto: Signal<boolean>;            // default true
  readonly mode: Signal<UiLoadingMode>;      // default 'indeterminate'
  readonly progress: Signal<number>;         // 0..100, default 0
  readonly visible: Signal<boolean>;         // computed: manualVisible || pendingRequests > 0
  readonly pendingRequests: Signal<number>;

  show(): void;
  hide(): void;
  setAutoMode(value: boolean): void;
  setMode(value: UiLoadingMode): void;
  setProgress(value: number): void;          // rejects values outside 0..100 (console.error, no change)

  /** Used by the interceptor. Registers one in-flight request; returns a function that ends it (idempotent). */
  beginRequest(): () => void;
}

// src/@ui/services/loading/ui-loading.interceptor.ts
export const uiLoadingInterceptor: HttpInterceptorFn;

/** Set to true on a request to keep it invisible to the loading bar. */
export const UI_LOADING_IGNORE = new HttpContextToken<boolean>(() => false);
/** Convenience: new HttpContext().set(UI_LOADING_IGNORE, true) */
export function uiNoLoadingBar(context?: HttpContext): HttpContext;

/** Optional URL exclusions (provided through provideUi({ loading: { excludeUrls } })). */
export const UI_LOADING_EXCLUDE = new InjectionToken<ReadonlyArray<string | RegExp>>('UI_LOADING_EXCLUDE');

// src/@ui/components/loading-bar/ui-loading-bar.component.ts
@Component({ selector: 'ui-loading-bar' })
export class UiLoadingBarComponent {
  /** When it changes, it sets the service's auto mode. Default true. */
  readonly autoMode = input(true, { transform: booleanAttribute });
}
```

### Behavior
- **Auto mode** (default). The interceptor checks `auto()` at the moment each request starts. If auto is on, and the request is not ignored or excluded, it calls `beginRequest()` and ends that request when the response stream finalizes (success, error, or unsubscribe/cancel). When auto is off, requests pass through untouched.
- **Counting.** Count each request instance, not each URL. Two concurrent requests to the same URL keep the bar visible until **both** finish. (Keying by URL would hide the bar too early.) The count never drops below 0.
- **Manual mode.** `show()` and `hide()` set a manual flag. The bar is visible while the manual flag is set **or** any tracked request is pending. Call sites call `show()` before their own work and `hide()` after it, and they **no longer need `setTimeout` wrappers**.
- `setMode('determinate')` together with `setProgress(n)` makes the bar show `n%` filled. `setMode('indeterminate')` returns to the looping animation. Progress values outside 0..100 are rejected with a `console.error` and ignored.
- **Exclusion.** A request is excluded when its `HttpContext` has `UI_LOADING_IGNORE = true`, or its URL matches any entry in `UI_LOADING_EXCLUDE`. A string entry matches when the URL starts with it; a RegExp entry is tested against the URL. Suggested default exclusions: none. Polling or background calls should use `uiNoLoadingBar()`.
- The component only renders the bar while `visible()` is true. It reads all of its state from the service, so one service instance drives every layout.

### Visual spec
- **Host.** `position: fixed; top: 0; left: 0; width: 100%; z-index: 999; height: 6px; pointer-events: none`. Print: hidden.
- **Bar.** A PrimeNG `p-progressbar` (`mode` and `value` bound from the service, `showValue=false`) that fills the host: **height 6 px**, no border radius.
  - Track: the PrimeNG progressbar background token, *(measured)* `gray-200` (rgb 226 232 240) in light mode.
  - Value: `primary` (*(measured)* rgb 79 70 229 in the default theme).
- **Indeterminate.** PrimeNG's standard two-segment sweep: 2.1 s per cycle; the first segment uses `cubic-bezier(0.65, 0.815, 0.735, 0.395)`; the second starts after a 1.15 s delay and uses `cubic-bezier(0.165, 0.84, 0.44, 1)`; it loops forever.
- **Determinate.** The value width is `progress%`, with a width transition of 1 s ease-in-out.
- Note: today the PrimeNG bar actually overflows its 6 px host and paints at the PrimeNG default 20 px height, with a 6 px radius and a "40%" label in determinate mode (*(measured)*, screenshot `scratchpad/core-loadingbar.png`). This spec deliberately uses **6 px with no label**, which matches the host's intended size. See open question Q1.

### States
Hidden; visible-indeterminate; visible-determinate (at a given progress value).

### Accessibility
The bar has `role="progressbar"` (PrimeNG provides it), and `aria-valuenow` in determinate mode. Add `aria-label="Loading"`. It never takes focus.

### Call sites
- `<fuse-loading-bar>` is the first element in all 11 layout templates: `app/layout/layouts/empty`, `vertical/{classic,classy,compact,dense,futuristic,thin}` and `horizontal/{centered,enterprise,material,modern}`. None of them bind `autoMode`.
- `app/shared/abstracts/base-form.component.ts`: manual `show()`/`hide()` around load-by-id, save and delete, each currently wrapped in `setTimeout`.
- `app/shared/abstracts/base-table.component.ts`: injected (no direct calls found).
- `app/shared/components/grid/common/grid.service.ts`: manual `show()`/`hide()` around data loads.

### Acceptance checklist
- [ ] An HTTP GET with a 2 s delay shows the bar for about 2 s, then it disappears.
- [ ] Two parallel requests to the same URL: the bar stays until the second one finishes.
- [ ] A request that errors or is cancelled still clears its count.
- [ ] A request with `context: uiNoLoadingBar()` never shows the bar.
- [ ] A URL that matches `excludeUrls` never shows the bar.
- [ ] `setAutoMode(false)`: requests do not show the bar, but `show()` still does.
- [ ] `setMode('determinate'); setProgress(40)` gives a bar 40% filled, and the fill animates.
- [ ] `setProgress(120)` logs an error and leaves the value unchanged.
- [ ] The bar is 6 px tall, sits at the very top above the layout (z-index 999), and does not intercept clicks.
- [ ] It works with zoneless change detection and needs no `setTimeout` in callers.

---

## 3. Fullscreen toggle: `ui-fullscreen`

### Purpose
A toolbar icon button that toggles browser fullscreen for the whole document.

### Proposed API
```ts
@Component({ selector: 'ui-fullscreen', exportAs: 'uiFullscreen' })
export class UiFullscreenComponent {
  readonly tooltip = input<string>('Toggle Fullscreen');
  /** Optional custom icon template; replaces the default glyph. */
  readonly iconTemplate = input<TemplateRef<unknown> | undefined>(undefined);
  /** True while the document is in fullscreen; updated from 'fullscreenchange'. */
  readonly isFullscreen: Signal<boolean>;
  /** False when the Fullscreen API is unavailable. The component then renders nothing. */
  readonly supported: Signal<boolean>;
  toggle(): void;
  enter(): Promise<void>;
  exit(): Promise<void>;
}
```

### Behavior
- `toggle()` checks the *current* fullscreen element. If there is none, it requests fullscreen on `document.documentElement`; otherwise it exits fullscreen.
- Use the standard API (`requestFullscreen`, `exitFullscreen`, `fullscreenElement`). Fall back to the `webkit`-prefixed variants when the standard ones are missing (older Safari). Do not throw when the API is unsupported: hide the button instead (`supported() === false`).
- `isFullscreen` follows `fullscreenchange` (and `webkitfullscreenchange`), so pressing Esc also updates the state.
- Ignore a rejected promise from the browser (no user gesture, or the request was denied), logging it at debug level only.

### Visual spec *(measured)*
- **Button.** PrimeNG `p-button` styled as rounded, text and icon-only: **40×40 px**, radius 50%, transparent background, glyph color is the toolbar text color (in the classy layout, `primary-600`), 8 px vertical padding. Hover and active use the PrimeNG text-button hover background.
- **Default icon.** PrimeIcons `pi pi-expand` through `ui-icon`, 24×24.
- **Tooltip.** PrimeNG `pTooltip` with the `tooltip` text, PrimeNG's default position.
- Layouts hide it below `md` with the host classes `hidden md:block`, so the host must be a plain element that accepts those classes (the host's `display` is controlled by the classes).

### States
Not fullscreen; fullscreen (same glyph today); unsupported (not rendered). Optionally, switch the glyph to `pi pi-window-minimize` while in fullscreen (see Q2).

### Accessibility
The button has `aria-label` equal to the tooltip text and `aria-pressed` equal to `isFullscreen()`. It is focusable and works with Enter and Space (native button).

### Call sites
`<fuse-fullscreen class="hidden md:block">` in the toolbar of all 10 non-empty layouts (classic, classy, compact, dense, futuristic, thin, centered, enterprise, material, modern).

### Acceptance checklist
- [ ] A click enters fullscreen; a second click exits; Esc exits and `isFullscreen()` becomes false.
- [ ] The button is 40×40, round, transparent, with a 24 px `pi-expand` glyph in the toolbar color.
- [ ] A tooltip "Toggle Fullscreen" appears on hover.
- [ ] Hidden below 960 px by the host classes.
- [ ] No exception in a browser without the Fullscreen API.

---

## 4. Alert: `ui-alert`, `UiAlertService`

### Purpose
An inline message box with eight color types and four appearances. It can show an optional icon and title, and it can be dismissed, with a dismissal that can be addressed by name (and optionally remembered).

### Recommendation on PrimeNG `p-message`
`p-message` (with severities `info`, `success`, `warn`, `error`, `secondary` and `contrast`, and variants `outlined`, `text` and `simple`) covers only part of this unit:
- it has no `primary`, `accent` or `basic` types that follow the theme;
- it has no `fill` or left-`border` appearance;
- its colors differ from the palette below (for example, its outlined variant has a transparent background, while ours has a tinted background with a ring).

**Decision: build `ui-alert` as its own small component styled with Tailwind classes.** Optionally reuse PrimeNG's close-button styling (a `p-button` with the text and rounded options). Do not wrap `p-message`: it would need pass-through overrides for every appearance and type, which costs more than it saves.

### Proposed API
```ts
export type UiAlertAppearance = 'border' | 'fill' | 'outline' | 'soft';
export type UiAlertType = 'primary' | 'accent' | 'warn' | 'basic' | 'info' | 'success' | 'warning' | 'error';

@Component({ selector: 'ui-alert', exportAs: 'uiAlert' })
export class UiAlertComponent {
  readonly appearance = input<UiAlertAppearance>('soft');
  readonly type = input<UiAlertType>('primary');
  readonly name = input<string>(uiRandomId());          // used by UiAlertService
  readonly dismissible = input(false, { transform: booleanAttribute });
  readonly dismissed = model(false);                      // two-way: [(dismissed)]
  readonly showIcon = input(true, { transform: booleanAttribute });
  /** New: remember the dismissal across reloads (localStorage) under the alert's name. */
  readonly persistDismissal = input(false, { transform: booleanAttribute });
  readonly dismissedChange: OutputRef<boolean>;           // from model()

  dismiss(): void;
  show(): void;
}

/** Content slots: [uiAlertTitle], [uiAlertIcon]; default slot = message. */
export class UiAlertTitleDirective {}  // selector: '[uiAlertTitle]'
export class UiAlertIconDirective {}   // selector: '[uiAlertIcon]'

@Injectable({ providedIn: 'root' })
export class UiAlertService {
  dismiss(name: string): void;
  show(name: string): void;
  /** Reactive dismissed state for a name (false when unknown). */
  isDismissed(name: string): Signal<boolean>;
}
```

### Behavior
- **Visibility rule.** The alert is rendered when it is **not dismissible**, or when it is dismissible and **not dismissed**. A non-dismissible alert is always visible: `dismiss()`, `show()`, service calls and `[dismissed]="true"` have no effect on it.
- `dismiss()`: if the alert is dismissible and not already dismissed, set `dismissed` to true. This emits `dismissedChange(true)` and plays the leave animation. `show()` does the reverse and emits `dismissedChange(false)`. Calling either one when the alert is already in that state is a no-op and emits nothing.
- **Addressing by name.** `UiAlertService.dismiss(name)` and `show(name)` act on every live alert with that `name`. The service keeps a name-to-state map (as signals), so **an alert that is created later with the same name starts in the last state** that was requested for it. Empty or missing names are ignored.
- **Persistence (new, opt-in).** When `persistDismissal` is true, the dismissed state is stored at the localStorage key `ui-alert:<name>`, and it is read back on creation. Storage failures are swallowed. This only makes sense with an explicit, stable `name`.
- **Icon.** When `showIcon` is true: if the consumer projected a `[uiAlertIcon]`, show it; otherwise show the default PrimeIcon for the type:
  - primary, accent and success: `pi-check-circle`
  - warn and error: `pi-times-circle`
  - basic: `pi-circle`
  - info: `pi-info-circle`
  - warning: `pi-exclamation-triangle`
- **Title and message.** Each slot is shown only when it has content. When both exist, the message sits 4 px below the title.
- The dismiss button is present only when the alert is `dismissible`.

### Visual spec
**Common** *(measured on sign-in)*:
- Block element. Its container is flex, with **16 px padding**, a **14 px** font, and a 6 px border radius (every appearance). The `border` appearance is also `overflow: hidden`.
- **Icon column.** The icon is aligned to the top, sits 12 px to the left of the content, and is 20 px in size (`icon-size-5`). It is round (border-radius 50%) and uses `currentColor`.
- **Content.** A vertical column, centered vertically.
  - Title: weight 600, line-height 20 px.
  - Message: line-height 20 px, 4 px below the title.
- **Dismiss button.** Positioned absolutely at top 10 px and right 10 px. It is a **32×32** round text button with a 16 px `pi-times` glyph. When the alert is dismissible, the content gets a 32 px right margin so text never runs under the button.
- **Inline `code`** inside the message gets the code colors listed below.

**Per-appearance colors** (X = palette for the type):
- primary, accent, warn → their theme palettes
- basic → `gray`
- info → `blue`
- success → `green`
- warning → `amber`
- error → `red`

| Appearance | Light | Dark |
|---|---|---|
| **soft** | bg X‑50; icon X‑600; title and close button X‑900; message X‑700; code: text X‑800 on X‑200 | bg X‑600; icon, title and close button white; message X‑200 |
| **outline** | same as soft **plus** a 1 px inset ring X‑400. *(measured, info)*: bg rgb 239 246 255, ring rgb 96 165 250, message rgb 29 78 216 | same as soft dark (the ring stays X‑400) |
| **fill** | bg X‑600 (warning uses amber‑**500**); icon, title and close button white; message X‑100; code: text X‑800 on X‑200 (success code text gray‑800) | same as light |
| **border** | card background (white), `shadow-md`, a 4 px vertical stripe flush left over the full height in X (see below); title and icon X; message gray‑600 | bg gray‑700; stripe X‑400; title and icon X‑400; message gray‑300; code: gray‑800 on gray‑400 |

- **basic exceptions.** soft and outline use bg gray‑100, icon gray‑600, title gray‑900, message gray‑700, ring gray‑400; dark bg gray‑600 with message gray‑200. fill uses bg gray‑600 with message gray‑100.
- **Border appearance stripe and title colors in light mode.**
  - primary, accent and warn: stripe and title in the base theme color (`primary`, `accent`, `warn`).
  - basic: gray‑600.
  - info: stripe blue‑600, title blue‑700.
  - success: green‑500.
  - warning: amber‑500.
  - error: stripe red‑600, title red‑700.

**Animation.**
- Entering (shown or created): fade in, opacity 0→1, **225 ms `cubic-bezier(0, 0, 0.2, 1)`**.
- Leaving (dismissed): fade out, opacity 1→0, **195 ms `cubic-bezier(0.4, 0, 1, 1)`**, then removed.
- Skip the enter animation on the very first render when the alert starts visible: no flash on page load is required, but it is acceptable.

### States
Visible; dismissed (not rendered); entering; leaving; with or without icon; with or without title.

### Accessibility
- The container has `role="alert"` for `error`, `warn` and `warning`, and `role="status"` for all other types (polite).
- The dismiss button is a native `<button>` with `aria-label="Dismiss"`.
- Decorative icons are `aria-hidden`.
- Every listed color combination keeps a text contrast of at least 4.5:1 for the message.

### Call sites
Every current use has `appearance='outline'`, `showIcon=false` and class `mt-8`, and every one projects the message as plain text. None uses `dismissible`, `name` or a title.
- `app/modules/auth/sign-in/sign-in.component.html`: a static `info` alert ("You are browsing …"), plus a dynamic one (`success` or `error`) shown after submit, with the `shake` animation on error.
- `app/modules/auth/{sign-up,forgot-password,reset-password,unlock-session}`: the dynamic alert (`success` or `error`) with `shake` on error.
- The type is imported in those components for their `alert: { type; message }` state.

### Acceptance checklist
- [ ] All 8 types × 4 appearances render with the colors in the table, in both light and dark.
- [ ] The sign-in info alert measures: padding 16, radius 6, bg blue‑50, inset ring blue‑400, message blue‑700, 14 px / 20 px.
- [ ] `showIcon=false` removes the icon column; the default icon per type is correct; a projected `[uiAlertIcon]` replaces it.
- [ ] Title and message spacing is 4 px; empty slots take no space.
- [ ] Dismissible: the 32×32 close button sits at top-right 10/10; clicking it fades the alert out in 195 ms and emits `dismissedChange(true)`.
- [ ] `UiAlertService.dismiss('x')` hides every alert named `x`; `show('x')` brings them back. An alert named `x` that is created afterwards starts dismissed.
- [ ] A non-dismissible alert ignores dismiss and show.
- [ ] `persistDismissal`: dismiss, reload, and the alert stays dismissed.
- [ ] `[@shake]`, or its replacement from the animations section, on the host still works.

---

## 5. Drawer: replaced by PrimeNG `p-drawer`

### Decision
**Do not build a generic `ui-drawer`.** The only call site is the settings panel. It uses over mode, a fixed position, the right side, a dark overlay, open/close/toggle through a template reference, and a 400 px width. PrimeNG `p-drawer` covers all of that. "Side" (push) mode, absolute (non-fixed) positioning and name-based lookup have **no** call sites, so they are dropped. The vertical navigation has its own open/close mechanics and is covered by the navigation spec.

### Required configuration (used by the settings spec)
| Need | `p-drawer` setting |
|---|---|
| opened / toggle / close | `[(visible)]` bound to a component signal; the cog button toggles it; the header close button sets it to false |
| position right | `position="right"` |
| mode over + overlay | `[modal]="true"`; clicking the overlay closes the drawer: `[dismissible]="true"` |
| fixed to viewport | the default behavior of `p-drawer` (fixed); `appendTo="body"` |
| transparent overlay (optional) | `maskStyleClass="ui-drawer-mask-transparent"` (background transparent) |
| own header and layout | use the `#headless` template so PrimeNG's header, close icon and paddings are not rendered |
| no scroll lock (current behavior) | `[blockScroll]="false"` |
| Esc closes | `[closeOnEscape]="true"` (an accepted improvement) |
| motion | `transitionOptions="400ms cubic-bezier(0.25, 0.8, 0.25, 1)"` |

### Visual spec *(measured, settings drawer open; see also `ref/settings-open.png`)*
- **Panel.** Full viewport height. Width **100 vw below 600 px** and **400 px from 600 px up** (`w-screen sm:w-[25rem]`). Background is the card color (white in light). Shadow `0 2px 8px 0 rgba(0,0,0,0.35)`. No border and no border radius. Content `overflow: hidden`, filling the panel. It sits above the overlay.
- **Overlay.** Covers the viewport, `rgba(0,0,0,0.6)` (or transparent when that option is used). It fades in and out over **300 ms `cubic-bezier(0.25, 0.8, 0.25, 1)`**. Override PrimeNG's default 0.4 alpha mask with the 0.6 value through a `ui-drawer-mask` class.
- **Slide.** When it opens, the panel slides from `translateX(100%)` to 0. When it closes, it slides back. Both take 400 ms with the same curve. While closed, the panel is not visible and not focusable.
- **Stacking.** The panel and overlay are above all layout chrome. The settings cog (z‑90) and the loading bar (z‑999) may stay above or below. Today the drawer is at z‑999 and the overlay at z‑299. PrimeNG's modal z-index (about 1100+) is acceptable.
- Provide these as two global classes in `@ui` styles: `ui-drawer` (panel overrides) and `ui-drawer-mask` (mask color, plus the `-transparent` variant).

### Accessibility
PrimeNG provides `role="complementary"` or a dialog role, a focus trap and Esc handling. The headless content must include a visible close button with `aria-label="Close"`. Focus returns to the cog button when the drawer closes.

### Call sites
`app/layout/common/settings/settings.component.html` (`#settingsDrawer`, with `fixed`, mode over, name `settingsDrawer`, position right, classes `w-screen min-w-screen sm:w-100 sm:min-w-100 z-999`). The cog button and the header close button call toggle and close.

### Acceptance checklist
- [ ] The cog opens a 400 px panel from the right with a 400 ms ease; below 600 px the panel is full width.
- [ ] The overlay is `rgba(0,0,0,.6)`; clicking it closes the drawer; Esc closes it.
- [ ] The panel shadow is `0 2px 8px rgba(0,0,0,.35)`, with no header padding from PrimeNG.
- [ ] The page behind can still scroll (no scroll lock).

---

## 6. Scrollbar directive: dropped in favour of native CSS

### Decision
**Drop the `fuseScrollbar` directive and the `perfect-scrollbar` dependency**, including its vendor CSS import in `styles/vendors.scss` and its overrides stylesheet. Use native overflow scrolling with CSS-styled scrollbars. Its remaining users are the vertical navigation (2 scroll areas) and quick-chat (which is removed).

The one programmatic feature still needed is "scroll the active navigation item into view, offset 120 px from the top, even if it is already visible". Provide it as a utility in `UiUtils` (see the utils section):
```ts
uiScrollIntoView(container: HTMLElement, target: Element | string, opts?: { offsetTop?: number; onlyIfHidden?: boolean; behavior?: ScrollBehavior }): void
```

### Scrollbar look to reproduce
Two looks exist today:

**A. Global native scrollbars** (all scrollable areas). Applied at viewport ≥ 960 px and **not on macOS/iOS**, so it applies when the `body` lacks `os-mac`. On mac, native overlay scrollbars are kept.
- Track: 8 px wide (vertical) and 8 px tall (horizontal), transparent. When the scrollbar is hovered, the track becomes `rgba(0,0,0,0.06)`.
- Thumb: radius 20 px with a 2 px transparent border, so the visible thumb is 4 px with rounded ends. Color `rgba(0,0,0,0.24)`; while active (dragging) `rgba(0,0,0,0.37)`.
- Dark scheme: the thumb is `rgba(255,255,255,0.24)`, and `rgba(255,255,255,0.37)` while active.
- Implement it with `::-webkit-scrollbar*` (Chromium and Safari). For Firefox, use `scrollbar-width: thin; scrollbar-color: <thumb> transparent` only inside `@supports not selector(::-webkit-scrollbar)`. Recent Chromium ignores the `::-webkit` rules when the standard properties are set.

**B. Overlay-style thin scrollbar** (previously the perfect-scrollbar look, used by the vertical navigation panels). Provide it as the utility class `ui-scrollbar-thin`:
- `overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain`. This replaces the old "do not propagate the wheel to the page" option.
- Thumb 6 px wide, `rgba(0,0,0,0.5)` with a 1 px `rgba(255,255,255,0.15)` outline, rounded.
- The thumb is **only visible while the area is hovered or scrolling**: transparent otherwise, shown on `:hover` and `:focus-within`. On direct hover of the scrollbar the old look widened the thumb to 10 px over 225 ms `cubic-bezier(0.25, 0.8, 0.25, 1)`. That widening is optional, because native scrollbars cannot animate width; matching the 6 px resting look is enough.
- No space is reserved for the scrollbar where the platform supports overlay scrollbars. Elsewhere, use `scrollbar-gutter: stable` only if layout jumps are visible.
- Touch devices (iOS and Android) always use the platform's native scrolling. This matches the old behavior, which disabled the custom scrollbar there.

The CSS lives in the `@ui` styles (the styling spec owns the file). This unit defines the look above.

### Acceptance checklist
- [ ] No `perfect-scrollbar` in `package.json` or the styles.
- [ ] On Windows or Linux at ≥ 960 px: 8 px track, 4 px visible rounded thumb at 24% black (37% while dragging); in dark, white at 24%.
- [ ] On macOS: native scrollbars are unchanged.
- [ ] `ui-scrollbar-thin` areas show a 6 px 50%-black thumb only on hover or scroll; the wheel does not scroll the page when the area reaches its end.
- [ ] `uiScrollIntoView(navEl, '.ui-vertical-navigation-item-active', { offsetTop: -120 })` brings the active item to about 120 px from the top.

---

## 7. `UiConfigService` (signal-based, persisted)

### Purpose
The single source of truth for the app shell configuration: layout name, color scheme, theme, breakpoints and the theme list. Layouts, the settings panel, the media watcher and the PrimeNG theme sync all read it. **New:** the user's choices survive reloads.

### Proposed API
```ts
export type UiScheme = 'auto' | 'dark' | 'light';
export type UiScreens = Record<string, string>;            // alias -> min-width CSS length
export type UiTheme = 'theme-default' | (string & {});
export interface UiThemeOption { id: string; name: string }
export type UiLayoutName =
  | 'empty' | 'classic' | 'classy' | 'compact' | 'dense' | 'futuristic' | 'thin'
  | 'centered' | 'enterprise' | 'material' | 'modern';

export interface UiConfig {
  layout: UiLayoutName | (string & {});
  scheme: UiScheme;
  screens: UiScreens;
  theme: UiTheme;
  themes: UiThemeOption[];
}
export type UiConfigPatch = Partial<UiConfig>;  // nested objects may be partial too (DeepPartial)

export const UI_CONFIG = new InjectionToken<UiConfig>('UI_CONFIG');              // defaults from provideUi
export const UI_CONFIG_STORAGE_KEY = new InjectionToken<string | null>('UI_CONFIG_STORAGE_KEY'); // default 'ui-config'; null disables

@Injectable({ providedIn: 'root' })
export class UiConfigService {
  readonly config: Signal<UiConfig>;
  readonly layout: Signal<string>;
  readonly scheme: Signal<UiScheme>;
  readonly theme: Signal<string>;
  readonly screens: Signal<UiScreens>;
  readonly themes: Signal<UiThemeOption[]>;
  /** 'auto' resolved with prefers-color-scheme (reactive). */
  readonly resolvedScheme: Signal<'dark' | 'light'>;
  /** Compatibility stream of `config`. */
  readonly config$: Observable<UiConfig>;

  set(patch: UiConfigPatch): void;                    // deep merge, then persist
  update(fn: (current: UiConfig) => UiConfigPatch): void;
  reset(): void;                                      // back to UI_CONFIG defaults, clears storage
}
```

### Defaults (from `app.config.ts`, passed to `provideUi`)
- layout `classy`; scheme `light`; theme `theme-default`.
- screens: `sm 600px`, `md 960px`, `lg 1280px`, `xl 1440px`.
- themes: `theme-default` "Default", `theme-brand` "Brand", `theme-teal` "Teal", `theme-rose` "Rose", `theme-purple` "Purple", `theme-amber` "Amber".

### Behavior
- **Merge semantics.** `set(patch)` produces a **new** object: `{ ...current }`, with plain nested objects (`screens`) merged key by key and recursively. **Arrays (`themes`) and primitives are replaced, not merged by index.** `undefined` values in the patch are ignored. The signal emits only when something actually changed (structural equality on the touched keys), so `set({ scheme: 'dark' })` twice emits once.
- **Never mutate.** The config object must not be mutated in place by consumers. Freeze it in dev mode. (The current layout shell writes into it directly; the layout spec must use `set()` instead.)
- **Reset.** Replaces the config with a fresh copy of the `UI_CONFIG` defaults and removes the stored entry. (Note: today's reset re-emits the current value, which is a no-op. The new one must truly return to the defaults.)
- **Persistence.**
  - Storage key: `UI_CONFIG_STORAGE_KEY` (default `'ui-config'`) in `localStorage`.
  - Stored shape: `{ "v": 1, "layout": string, "scheme": UiScheme, "theme": string }`. **Only the user-choosable fields** are stored. `screens` and `themes` always come from code, so changing them in a release takes effect.
  - Load once at construction and validate. Drop `scheme` unless it is one of the three values. Drop `theme` unless it is in `themes`. Drop `layout` unless it is a non-empty string from the known layout names. Drop the whole entry if `v` is unknown or the JSON is invalid. Valid fields are applied over the defaults.
  - Write after every effective change (an `effect` on the three fields). Wrap every storage access in try/catch, and skip storage on the server or when it is unavailable.
  - Cross-tab sync: listen to the `storage` event for the same key and apply the validated values. This is nice to have.
- **Scheme resolution.** `resolvedScheme` is `scheme` unless it is `auto`, in which case it follows `(prefers-color-scheme: dark)` live.
- **Applying to the document.** A root effect, registered by `provideUi` and on by default, keeps the DOM in sync:
  - `body` gets exactly one of the classes `light` or `dark` (from `resolvedScheme`).
  - `html` gets the `dark` class when the scheme resolves to dark, because PrimeNG's `darkModeSelector` is `html.dark`. This replaces `app/core/primeng/primeng-theme.service.ts`. Its `auto` handling did not follow live OS changes; this one does.
  - `body` has exactly one `theme-*` class (remove any previous `theme-*` class, then add the current one).
  - This can be turned off with `provideUi({ applyToDocument: false })` if the layout spec prefers to own it.
- **Layout overrides** (owned by the layout spec, stated here for consistency): route data `layout` beats the `?layout=` query parameter, which beats the persisted or default `layout`. See Q4 for whether `?layout=` is persisted.

### Visual spec
None of its own. The scheme switch must not flash. Because the persisted scheme is applied in the constructor, which runs during app initialization before the first render, the first painted frame already uses the stored scheme.

### Accessibility
`auto` must honor the OS preference live.

### Call sites
- `app/app.config.ts`: provides the defaults (`provideFuse({ fuse: … })` becomes `provideUi({ config: … })`).
- `app/layout/layout.component.ts`: reads layout, scheme and theme; applies the body classes; writes the layout from the query param.
- `app/layout/common/settings/settings.component.ts/.html`: reads `layout`, `scheme`, `theme` and `themes`; calls `set({layout})`, `set({scheme})` and `set({theme})`. Its layout change first clears the `?layout` query param and then sets the layout.
- `app/core/primeng/primeng-theme.service.ts`: syncs `html.dark` (superseded by the document effect above).
- `UiMediaWatcherService`: reads `screens`.

### Acceptance checklist
- [ ] `set({scheme:'dark'})`: body has `dark` (not `light`), html has `dark`; a reload keeps dark.
- [ ] `set({theme:'theme-teal'})`: body has `theme-teal` and no other `theme-*`; a reload keeps it.
- [ ] `set({layout:'modern'})`: a reload keeps the modern layout.
- [ ] `set({screens:{md:'1000px'}})` keeps `sm`, `lg` and `xl`.
- [ ] `set({themes:[…2 items]})` replaces the list (it does not merge by index).
- [ ] `reset()` returns to classy, light and theme-default, and clears `localStorage['ui-config']`.
- [ ] A corrupted or foreign `ui-config` value is ignored without errors; an unknown theme id is ignored.
- [ ] In `auto`, toggling the OS dark mode flips the classes live.
- [ ] No storage access during SSR or prerender; private mode (where storage throws) does not break the app.

---

## 8. `UiMediaWatcherService`

### Purpose
Reactive breakpoint matching based on the config `screens`, plus arbitrary media queries (for example, `prefers-color-scheme`).

### Proposed API
```ts
export interface UiMediaChange { matchingAliases: string[]; matchingQueries: Record<string, string> }

@Injectable({ providedIn: 'root' })
export class UiMediaWatcherService {
  /** Aliases whose min-width currently matches, in screens order, e.g. ['sm','md']. */
  readonly matchingAliases: Signal<readonly string[]>;
  /** alias -> the '(min-width: …)' query that matched. */
  readonly matchingQueries: Signal<Readonly<Record<string, string>>>;
  /** Convenience used by layouts: viewport is below 'md'. */
  readonly isLtMd: Signal<boolean>;
  readonly prefersDark: Signal<boolean>;

  /** 'md' => width >= md; 'lt-md' => width < md. Unknown alias => false. Cached per key. */
  is(alias: string): Signal<boolean>;
  /** Any CSS media query, e.g. '(prefers-color-scheme: dark)'. Cached per query. */
  query(mediaQuery: string): Signal<boolean>;

  /** Compatibility streams. */
  readonly onMediaChange$: Observable<UiMediaChange>;          // replays the latest value
  onMediaQueryChange$(query: string | string[]): Observable<{ matches: boolean; breakpoints: Record<string, boolean> }>;
}
```

### Behavior
- Each alias `a` with value `v` in `config.screens` becomes the query `(min-width: v)`. An alias "matches" when its query matches. With the default screens at 1100 px wide, `matchingAliases` is `['sm','md']`.
- When `screens` changes in the config, rebuild the queries.
- Use `window.matchMedia` with `change` listeners. CDK `BreakpointObserver` is also acceptable. Clean up when the service is destroyed. On the server, every query is `false` and `matchingAliases` is `[]`.
- `onMediaChange$` emits the current value immediately on subscribe, then on every change.

### Call sites
- All 10 non-empty layouts (`app/layout/layouts/{vertical,horizontal}/*/*.component.ts`): `isScreenSmall = !matchingAliases.includes('md')`. This drives the navigation mode (over or side) and its opened state. Migrate to `isLtMd()`.
- `app/layout/layout.component.ts`: watches `(prefers-color-scheme: dark|light)` for the auto scheme. This is now internal to `UiConfigService.resolvedScheme`.

### Acceptance checklist
- [ ] At 1440 px, `matchingAliases` is `sm, md, lg, xl`; at 959 px it is `sm` and `isLtMd()` is true; at 960 px `isLtMd()` is false.
- [ ] Resizing across 960 px flips `isLtMd` without a reload, and a layout's navigation switches mode.
- [ ] `query('(prefers-color-scheme: dark)')` follows the OS toggle live.
- [ ] Changing `config.screens.md` to `1000px` moves the breakpoint.

---

## 9. `UiPlatformService`

### Purpose
Detects the OS once and exposes a CSS class for it. Styles use it, for example the scrollbar rule `body:not(.os-mac)`.

### Proposed API
```ts
export type UiOsClass = 'os-windows' | 'os-mac' | 'os-unix' | 'os-linux' | 'os-ios' | 'os-android' | 'os-unknown';
@Injectable({ providedIn: 'root' })
export class UiPlatformService {
  readonly osName: UiOsClass;     // computed once
  readonly isBrowser: boolean;
  readonly isTouchOs: boolean;    // ios || android
}
```

### Behavior
- On the server, `osName` is `os-unknown`.
- In the browser, test the user agent in this order, with **later matches overriding earlier ones**: contains `Win` → windows; `Mac` → mac; `X11` → unix; `Linux` → linux; iOS (CDK `Platform.IOS`, which includes iPadOS) → ios; Android → android. So Android, whose UA contains "Linux", ends up as `os-android`, and iPadOS, which reports "Mac", ends up as `os-ios`.
- `provideUi` adds `osName` to `document.body` at startup. Today the layout shell does this; moving it into the provider means it also applies on the auth pages.

### Acceptance checklist
- [ ] macOS Chrome gives body `os-mac`; Windows gives `os-windows`; Android gives `os-android`; iPad gives `os-ios`.
- [ ] The class is present on `/sign-in`, before any layout renders.

---

## 10. Splash screen: `UiSplashScreenService`

### Purpose
A full-screen branded loader that is already present in `index.html` before Angular boots, and is removed after the first completed navigation.

### Proposed API
```ts
@Injectable({ providedIn: 'root' })
export class UiSplashScreenService {
  readonly visible: Signal<boolean>;
  show(): void;   // removes body class 'ui-splash-screen-hidden'
  hide(): void;   // adds body class 'ui-splash-screen-hidden'
}
```
The markup is a custom element `<ui-splash-screen>` placed as the first child of `<body>` in `index.html`, before `<app-root>`. It is a plain element, not an Angular component. It contains the logo image and three dot elements. The CSS ships as a global stylesheet (`src/assets/styles/splash-screen.css`, listed in `angular.json` styles) so that it applies before the JavaScript loads.

### Behavior
- Visible by default: the body does not have the hidden class.
- The service is created eagerly by `provideUi`. It hides the splash screen on the **first `NavigationEnd`**, and also on the first `NavigationCancel` or `NavigationError`, so a failed or redirected first navigation cannot leave the splash stuck. After that it stops listening.
- `show()` and `hide()` can be called later (for example, around a long re-initialization).
- While the splash screen is visible, `body` has `overflow: hidden`.

### Visual spec
- **Overlay.** Fixed, covering the viewport, column flex centered. Background `#111827` (gray-900, the dark slate shade). Text `#F9FAFB`. `z-index: 999999`. `pointer-events: none`.
- **Logo.** `assets/images/logo/logo.svg`, 120 px wide (max 120 px).
- **Spinner.** A row 56 px wide, 40 px below the logo, with three dots spaced across it (space-between). Each dot is 12×12 px, round, colored `#1E96F7`.
  - Dot animation: scale 0 at 0%, 80% and 100%, and scale 1 at 40%. Each cycle lasts 1 s, ease-in-out, infinite, with fill mode both.
  - Delays: dot 1 −0.32 s, dot 2 −0.16 s, dot 3 0 s.
- **Hide.** Opacity goes 1→0 over **400 ms `cubic-bezier(0.4, 0, 0.2, 1)`**, and visibility becomes hidden.
- The page `<title>` and logo are app branding and are outside this unit.

### Accessibility
`<ui-splash-screen role="progressbar" aria-label="Loading application" aria-busy="true">`. The logo has an `alt` text. Respect `prefers-reduced-motion` by disabling the dot bounce and the fade.

### Call sites
`src/index.html` (markup), `src/assets/styles/splash-screen.css`, `angular.json` (the style entry), and the provider initializer.

### Acceptance checklist
- [ ] A hard reload shows the dark splash screen with the logo and three bouncing blue dots until the first route renders, then it fades out in 400 ms.
- [ ] The body cannot scroll while the splash screen is shown.
- [ ] A first navigation that redirects (for example, `/` to `/sign-in`) still hides the splash screen.
- [ ] No Fuse naming in the markup or CSS (`ui-splash-screen`, `ui-splash-screen-hidden`, keyframes `ui-splash-bounce`).

---

## 11. `UiConfirmationService`

### Purpose
A promise- or observable-based modal "are you sure?" dialog with a colored icon, a title, a message, and confirm and cancel actions. It can be dismissible.

### Recommendation
Build it on PrimeNG **`ConfirmationService` + `p-confirmdialog`**, using a **headless template** so the layout below is reproduced exactly:
- A single internal host component, `UiConfirmationHostComponent`, renders `<p-confirmdialog key="ui-confirmation">` with a `#headless` template.
- The service mounts the host **lazily on the first `open()`**. It does this with `createComponent()` plus `ApplicationRef.attachView()`, appending the host to `document.body`. Apps therefore need no template change.
- Map PrimeNG outcomes as follows: accept → `'confirmed'`; reject through the Cancel button → `'cancelled'`; close icon, Esc or mask click → `undefined`.

(A `DialogService` / `p-dynamicdialog` approach is an acceptable alternative if the headless template proves limiting. The public API below stays the same either way.)

### Proposed API
```ts
export type UiConfirmationColor = 'primary' | 'accent' | 'warn' | 'basic' | 'info' | 'success' | 'warning' | 'error';
export type UiConfirmationResult = 'confirmed' | 'cancelled' | undefined;

export interface UiConfirmationConfig {
  title?: string;                     // may contain simple HTML (sanitized)
  message?: string;                   // may contain simple HTML (sanitized)
  icon?: { show?: boolean; name?: string; color?: UiConfirmationColor };
  actions?: {
    confirm?: { show?: boolean; label?: string; color?: 'primary' | 'accent' | 'warn' };
    cancel?: { show?: boolean; label?: string };
  };
  dismissible?: boolean;
}

export interface UiConfirmationRef {
  /** Emits once with the result, then completes. */
  readonly onClose: Observable<UiConfirmationResult>;
  /** Same result as a promise. */
  readonly closed: Promise<UiConfirmationResult>;
  close(result?: UiConfirmationResult): void;
}

@Injectable({ providedIn: 'root' })
export class UiConfirmationService {
  open(config?: UiConfirmationConfig): UiConfirmationRef;
}
```

### Behavior
- **Defaults**, deep-merged under the caller's config (nested objects merged and other values replaced):
  - title "Confirm action"
  - message "Are you sure you want to confirm this action?"
  - icon: shown, `heroicons_outline:exclamation-triangle`, color `warn`
  - confirm: shown, "Confirm", color `warn`
  - cancel: shown, "Cancel"
  - `dismissible: false`
- **Dismissible.** When `dismissible` is true, a close (X) button is shown, and Esc and mask clicks close the dialog with result `undefined`. When it is false, there is no X, and Esc and the mask do nothing: the user must pick an action. If both actions are hidden and the dialog is not dismissible, it can only close through `ref.close()`.
- **Results.** Cancel gives `'cancelled'`. Confirm gives `'confirmed'`. The result is emitted exactly once.
- **Confirm button color.** `primary` → PrimeNG severity primary; `accent` → `secondary`; `warn` → **`danger`** (red). Today `warn` falls through to the primary (indigo) button; see Q3.
- **Content.** Title and message are rendered as sanitized HTML. If either is empty or missing, that line is omitted; if both are empty, the text column is omitted.
- Only one confirmation at a time. A second `open()` while one is showing queues it, or replaces it: PrimeNG's single-host behavior of replacing is acceptable.

### Visual spec *(measured; screenshot `scratchpad/core-confirm.png`)*
- **Panel.** **420 px** wide (max `calc(100vw - 32px)`), radius 12 px, white card background (PrimeNG dialog token in dark), shadow `0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1)`. No PrimeNG header and no content padding. Centered.
- **Mask.** `rgba(0,0,0,0.4)`. PrimeNG default open and close animation.
- **Body.**
  - Padding 32 px all around (bottom 24 px below 600 px).
  - From 600 px up: a row with the icon on the left, a 16 px gap, then the text column with 32 px right padding (to clear the X).
  - Below 600 px: a column centered horizontally, text centered, and the text 16 px below the icon.
- **Icon badge.** 40×40 circle; glyph 24 px (`ui-icon`, the given name). Colors by `icon.color`:

  | color | light text / bg | dark text / bg |
  |---|---|---|
  | primary | primary‑600 / primary‑100 | primary‑50 / primary‑600 |
  | accent | accent‑600 / accent‑100 | accent‑50 / accent‑600 |
  | warn | warn‑600 / warn‑100 *(measured: red‑600 on red‑100)* | warn‑50 / warn‑600 |
  | basic | gray‑600 / gray‑100 | gray‑50 / gray‑600 |
  | info | blue‑600 / blue‑100 | blue‑50 / blue‑600 |
  | success | green‑500 / green‑100 | green‑50 / green‑500 |
  | warning | amber‑500 / amber‑100 | amber‑50 / amber‑500 |
  | error | red‑600 / red‑100 | red‑50 / red‑600 |

- **Title.** *(measured)* 18 px / 24 px, weight 500, default text color.
- **Message.** 14 px, secondary text color (slate‑500 in light), 4 px below the title.
- **Actions bar.**
  - Full width, background gray‑50 (dark: black at 10% opacity), padding 16 px 24 px, buttons 12 px apart.
  - Aligned right from 600 px up, centered below.
  - Order: Cancel, then Confirm.
  - Buttons: PrimeNG default size, *(measured)* 42 px tall, 6 px radius, 16 px text, 8 px 12 px padding.
  - Cancel: outlined, primary text, primary‑200 border.
  - Confirm: filled with the mapped severity.
- **Close button** (dismissible only). Placed top-right, 16 px inset. A 40×40 round text button with the `heroicons_outline:x-mark` glyph in the secondary text color.

### Accessibility
- `role="alertdialog"`, with `aria-labelledby` set to the title and `aria-describedby` set to the message.
- Focus moves into the dialog on open: to the Confirm button, or to the Cancel button when the color is warn, to make the safe action the default. The focus trap is PrimeNG's. Focus returns to the invoking element on close.
- Esc behaves as described under dismissible. The X button has `aria-label="Close"`.

### Call sites
- `app/shared/abstracts/base-form.component.ts` (`onDelete`): opens with a custom title and message, the `exclamation-triangle` icon in warn, confirm "Delete" in warn, cancel "Cancel", and `dismissible: true`. It subscribes to `onClose`, and on `'confirmed'` it runs the delete, with loading bar show and hide around it.
- `app/shared/abstracts/base-table.component.ts`: injected for subclasses (no direct call).

### Acceptance checklist
- [ ] `open()` with no config shows the default title, message, red warning icon, Cancel and Confirm (Confirm in danger red).
- [ ] The panel is 420 px with 12 px radius; the actions bar is gray‑50, right-aligned, 16/24 padding; the icon badge is 40 px.
- [ ] Cancel gives `onClose` → `'cancelled'`; Confirm gives `'confirmed'`; X, Esc or mask (dismissible) give `undefined`. Each emits once, then completes.
- [ ] With `dismissible: false`, there is no X, and Esc and the mask do nothing.
- [ ] `icon.show:false` hides the badge; `actions.cancel.show:false` hides Cancel; hiding both hides the bar.
- [ ] Below 600 px the content is stacked and centered.
- [ ] No template changes are needed in the app: the first `open()` mounts the host.

---

## 12. Utils: `UiUtils` (route matching options, ids, scrolling)

### Purpose
Small shared helpers. The navigation components need the active-route match options.

### Proposed API
```ts
// src/@ui/services/utils/ui-utils.ts  (plain functions/constants; an injectable wrapper is optional)
import { IsActiveMatchOptions } from '@angular/router';

/** "exact" link matching: same path and same query params; fragment and matrix params ignored. */
export const UI_EXACT_MATCH_OPTIONS: IsActiveMatchOptions;
/** "partial" link matching: current URL contains the link's path and its query params as a subset; fragment and matrix params ignored. */
export const UI_SUBSET_MATCH_OPTIONS: IsActiveMatchOptions;

export function uiMatchOptions(exact: boolean | undefined): IsActiveMatchOptions;
/** Random alphanumeric id ([A-Za-z0-9]), default length 10; honours `length`. */
export function uiRandomId(length?: number): string;
export function uiScrollIntoView(container: HTMLElement, target: Element | string,
  opts?: { offsetTop?: number; onlyIfHidden?: boolean; behavior?: ScrollBehavior }): void;
```

### Behavior
- **Exact options:** `paths: 'exact'`, `queryParams: 'exact'`, `fragment: 'ignored'`, `matrixParams: 'ignored'`.
- **Subset options:** `paths: 'subset'`, `queryParams: 'subset'`, `fragment: 'ignored'`, `matrixParams: 'ignored'`.
- `uiMatchOptions(true)` returns the exact options. `uiMatchOptions(false)` and `uiMatchOptions(undefined)` return the subset options, which are the default for navigation items without `exactMatch`.
- `uiRandomId()` returns a 10-character `[A-Za-z0-9]` string and honors `length`. Use `crypto.getRandomValues` when available. It is used as the default `name` for components such as alerts and navigation.
- `uiScrollIntoView`: resolve the target (a selector is resolved within the container). With `onlyIfHidden`, do nothing when the target is already fully visible. Otherwise, set `container.scrollTop` so the target's top sits at `offsetTop` px from the container's top edge, so a negative offset leaves room above. The default behavior is `auto` (instant).

### Call sites
- Navigation (separate spec): the horizontal and vertical "basic" items choose the exact or subset options from the item's `exactMatch` flag. The default is subset.
- Navigation, drawer and alert need default random names.
- Vertical navigation scrolls the active item into view (offset −120, scrolling even if visible).

### Acceptance checklist
- [ ] With `/products?page=2` active: a link `/products` with subset options is active; with exact options it is not. A link `/products?page=2` with exact options is active.
- [ ] A fragment or matrix param difference never affects whether a link is active.
- [ ] `uiRandomId(16).length === 16`; it only contains alphanumerics.

---

## 13. Validators: `UiValidators.mustMatch`

### Purpose
A form-group validator that requires two controls to hold the same value (password and confirmation).

### Proposed API
```ts
export class UiValidators {
  /** Group-level validator. Paths are dot-delimited (FormGroup.get syntax). */
  static mustMatch(controlPath: string, matchingControlPath: string): ValidatorFn;
  static isEmptyInputValue(value: unknown): boolean; // null/undefined or length === 0
}
```

### Behavior
- Attach it to the **group**. If either control is missing, the group is valid (`null`).
- Every time it runs, first remove a previous `mustMatch` error from the matching control, **keeping any other errors it has** (such as `required`). If no errors remain, its errors become `null`.
- If the matching control's value is empty (null, undefined, or a value whose `length` is 0), or the two values are strictly equal: return `null`.
- Otherwise, set `{ mustMatch: true }` on the **matching control** (merged with its other errors) and return `{ mustMatch: true }` for the group.
- It must not loop forever: do not trigger `updateValueAndValidity` in a way that re-enters the group validator, or emit with `emitEvent:false`.

### Call sites
`app/modules/auth/reset-password/reset-password.component.ts`: `mustMatch('password', 'passwordConfirm')`. The template shows a "must match" message when `passwordConfirm` is touched and `hasError('mustMatch')`.

### Acceptance checklist
- [ ] password "a", confirm "" → no `mustMatch`, and confirm still has `required`.
- [ ] password "a", confirm "b" → confirm has `mustMatch`, and the group is invalid.
- [ ] Changing confirm to "a" clears `mustMatch`, and the group becomes valid.
- [ ] Changing **password** to "c" re-flags confirm.

---

## 14. Animations (only the ones in use)

### Recommendation
Do not port the trigger library. Angular 20.3 (the version used here) supports `animate.enter` and `animate.leave` with plain CSS classes, and `@angular/animations` is deprecated from v20.2. Provide a small CSS file `src/@ui/styles/animations.css`, imported by the global styles, with the classes below. Use them as `animate.enter="ui-fade-in"` and `animate.leave="ui-fade-out"`. Every animation is disabled under `prefers-reduced-motion: reduce`. You can then drop `provideAnimationsAsync()` once nothing else (PrimeNG 20 included) depends on it. **Verify this first** (see Q5).

**Timing tokens** (keep them as CSS custom properties):
- `--ui-ease-standard: cubic-bezier(0.4, 0, 0.2, 1)`
- `--ui-ease-decelerate: cubic-bezier(0, 0, 0.2, 1)`
- `--ui-ease-accelerate: cubic-bezier(0.4, 0, 1, 1)`
- `--ui-ease-sharp: cubic-bezier(0.4, 0, 0.6, 1)`
- `--ui-ease-drawer: cubic-bezier(0.25, 0.8, 0.25, 1)`
- `--ui-duration-entering: 225ms`
- `--ui-duration-exiting: 195ms`
- `--ui-duration-complex: 375ms`

| Class (new) | Replaces | Used by | Spec |
|---|---|---|---|
| `ui-fade-in` | fadeIn | `ui-alert` (enter) | opacity 0→1, 225 ms decelerate |
| `ui-fade-out` | fadeOut | `ui-alert` (leave) | opacity 1→0, 195 ms accelerate |
| `ui-slide-in-top` | slideInTop | `app/layout/common/search` (bar-mode search overlay, enter) | translateY(−100%)→0, 225 ms decelerate |
| `ui-slide-out-top` | slideOutTop | same (leave) | translateY(0)→(−100%), 195 ms accelerate |
| `ui-shake` | shake | auth alerts on error: `sign-in`, `sign-up`, `forgot-password`, `reset-password`, `unlock-session` | 0.8 s `cubic-bezier(0.455, 0.03, 0.515, 0.955)`; translateX 0 at 0%, then alternating −10 px / +10 px at every 10% step from 10% to 90% (−10 at 10%, +10 at 20%, …, −10 at 90%), back to 0 at 100% |
| `ui-expand` / `ui-collapse` | expandCollapse | vertical navigation collapsable children | height 0 ↔ auto, 225 ms decelerate. Use `interpolate-size: allow-keywords` or a `grid-template-rows: 0fr↔1fr` technique; overflow hidden while animating |
| `ui-fade-in-left` / `ui-fade-in-right` | fadeInLeft/Right | vertical navigation aside panel (enter, chosen by the navigation position) | opacity 0 and translateX(−100% or +100%) → opacity 1 and translateX 0, 225 ms decelerate |
| `ui-fade-out-left` / `ui-fade-out-right` | fadeOutLeft/Right | same (leave) | opacity 1 and translateX 0 → opacity 0 and translateX(−100% or +100%), 195 ms accelerate |

Other motion in this unit set:
- drawer slide 400 ms drawer curve, overlay fade 300 ms drawer curve (see the drawer section);
- splash dots and fade (see the splash screen section);
- determinate loading-bar width 1 s ease-in-out;
- settings cog `animate-spin-slow` = `spin 3s linear infinite` (Tailwind config, owned by the styling spec).

**Shake triggering semantics.** It plays when the element enters while the error condition is true, and again every time the condition changes from false to true. The auth pages re-create the alert on every submit, so playing on enter when `type === 'error'` is enough. Apply the class conditionally: `[class.ui-shake]="alert.type === 'error'"`, which runs once on insert.

**Not used and not to be ported:**
- zoomIn and zoomOut;
- fadeInTop, fadeInBottom, fadeOutTop and fadeOutBottom;
- slideInBottom, slideInLeft and slideInRight;
- slideOutBottom, slideOutLeft and slideOutRight.

`app/modules/auth/confirmation-required` imports the animation set but binds no trigger, so it needs nothing.

### Acceptance checklist
- [ ] A wrong password on sign-in makes the error alert shake horizontally ±10 px for 0.8 s.
- [ ] Opening the bar-mode search slides it down from the top in 225 ms; closing slides it up in 195 ms.
- [ ] Navigation groups expand and collapse in 225 ms without clipping glitches.
- [ ] With reduced motion on, nothing animates and the end states are correct.

---

## 15. Version

- **Today:** a version constant (the string "19.0.0" with major, minor and patch parts) is written by the layout shell as an attribute `fuse-version="19.0.0"` on the `[ng-version]` element. Nothing reads it.
- **New:** export `UI_VERSION` (a string, with the same major/minor/patch split helper `UiVersion`) from `@ui/version`. `provideUi` sets `ui-version="<version>"` on the `[ng-version]` element. This is optional; drop it if no tooling needs it (see Q6).

---

## 16. Mock API: dropped (for the record)

- **What it did.** It was an HTTP interceptor that served fake responses in-app:
  - Services registered handlers per method and URL (`get`, `post`, `patch`, `delete`, `put`, `head`, `jsonp`, `options`), with URL parameters such as `:id`.
  - Each handler had a reply callback that returned `[status, body]` (or an Observable of it), an optional reply count limit, and a per-handler or global response delay. The global delay was provided through a token with default 0.
  - Requests with no matching handler passed through to the real backend.
  - Utilities generated GUIDs and fake JWTs.
  - It was wired by `provideFuse({ mockApi: { delay, services } })`, which eagerly instantiated the listed services in `app/mock-api/**` (auth, user, navigation, notifications, search, messages, shortcuts, chat).
- **Replacement.** A tiny dev-mock, specified elsewhere. `provideUi` has **no** mock options.

---

## 17. `provideUi()`

### Proposed API
```ts
export interface UiProviderConfig {
  config: UiConfig;                                   // defaults for UiConfigService
  configStorageKey?: string | null;                   // default 'ui-config'; null disables persistence
  applyToDocument?: boolean;                          // default true (scheme/theme/os classes)
  loading?: { auto?: boolean; excludeUrls?: ReadonlyArray<string | RegExp> };
  icons?: { path?: string; namespaces?: Record<string, string> };
  splashScreen?: boolean;                             // default true
}
export function provideUi(config: UiProviderConfig): EnvironmentProviders;
```

### Must register
1. `UI_CONFIG` = `config.config` (validated: the scheme must be one of the 3 values, and `theme` must be in `themes`), and `UI_CONFIG_STORAGE_KEY`.
2. `UI_ICONS_PATH` (default `'assets/icons/'`) and `UI_ICON_NAMESPACES` (default `{}`).
3. `UI_LOADING_EXCLUDE`. The **loading interceptor** is added **without calling `provideHttpClient` a second time**. The app already calls `provideHttpClient(withInterceptors([authInterceptor]))`. Either:
   - export `uiLoadingInterceptor` and document adding it to the app's single `withInterceptors([...])` list; or
   - register it through the multi-provider interceptor mechanism that `provideHttpClient` reads.

   The loading interceptor must run **outermost**, before the auth interceptor, so that requests the auth interceptor retries are still counted once. Initial auto mode comes from `loading.auto` (default true).
4. PrimeNG `ConfirmationService` (an environment-level provider, used by `UiConfirmationService`).
5. Eager initialization through `provideEnvironmentInitializer` (or `provideAppInitializer`):
   - `UiConfigService`: loads persisted values and starts the document class effect when `applyToDocument` is set;
   - `UiPlatformService`: adds the `os-*` class to `body` when `applyToDocument` is set;
   - `UiMediaWatcherService`;
   - `UiSplashScreenService`, when `splashScreen` is not false, to hide on the first navigation;
   - `UiLoadingService`;
   - optionally, the `ui-version` attribute.
6. It must **not** register: mock API anything, `DialogService` or `DynamicDialogModule` (unless the alternative confirmation implementation is chosen), or `lodash`-based helpers.

### Call site
`app/app.config.ts`: replace `provideFuse({ mockApi: {…}, fuse: {…} })` with `provideUi({ config: { layout: 'classy', scheme: 'light', screens: {…}, theme: 'theme-default', themes: […] } })`. Its position in the providers array does not matter. `PrimeNgThemeService` and its app initializer can be removed once `applyToDocument` handles `html.dark`.

### Acceptance checklist
- [ ] The app boots with only `provideUi(...)` and no `@fuse` import.
- [ ] The splash screen hides, body classes `light theme-default os-…` are present on first paint of `/sign-in`, and the loading bar reacts to HTTP.
- [ ] The confirmation dialog opens from `base-form` without any extra providers or template hosts.
- [ ] Persisted scheme, theme and layout are restored on reload.
- [ ] Only one `HttpClient` configuration exists, and both the auth and loading interceptors run.

---

## Open questions

- **Q1 (loading bar height).** Today the bar visibly paints at PrimeNG's default 20 px with a rounded track and a "NN%" label in determinate mode, because nothing overrides the bar height inside the 6 px host. This spec assumes the intended 6 px bar with no label. Should the rewrite instead reproduce the 20 px look exactly?
- **Q2 (fullscreen icon).** Keep `pi-expand` in both states (as today), or switch to `pi-window-minimize` while in fullscreen?
- **Q3 (confirm button color).** For `actions.confirm.color = 'warn'` the current dialog renders the default primary (indigo) button, which is visible in the "Delete" confirmation. The spec maps warn to the `danger` severity (red). Should we keep indigo for visual parity?
- **Q4 (layout persistence and `?layout=`).** Should a `?layout=` query parameter (used for previews) be persisted as the user's layout, as happens in-session today, or only apply for that visit? The spec assumes it applies through `set()` and is therefore persisted.
- **Q5 (`@angular/animations` removal).** Does any PrimeNG 20 component in use still require `provideAnimationsAsync()`? If so, keep the provider even though `@ui` itself no longer uses Angular animations.
- **Q6 (version attribute).** Is any tooling reading the `fuse-version` attribute? If not, drop `UI_VERSION` entirely.
- **Q7 (alert persistence).** Persisting dismissal (`persistDismissal`) is new and has no current call site. Should it be in scope for v1?
- **Q8 (scheme/theme ownership).** This spec puts the document class sync (`body` light/dark/theme-*, `html.dark`, `os-*`) in `provideUi`. Confirm that the layout spec does not also implement it.
