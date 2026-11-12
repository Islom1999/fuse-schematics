# UI spec: Navigation (`src/@ui/components/navigation`)

Status: functional specification for a clean-room implementation.
Target: Angular 20, standalone, `ChangeDetectionStrategy.OnPush`, zoneless, signal APIs (`input`, `output`, `model`, `computed`, `effect`), PrimeNG 20 and Tailwind 3.
Naming: selectors use the `ui-` prefix and classes use the `Ui` prefix.

The visual result must match the current starter as closely as possible. The measured values below come from the running reference app at 1440x900 (desktop) and 390x844 (mobile). The reference screenshots are in the session `scratchpad/ref/` folder: `layout-classic.png`, `layout-classy.png`, `layout-compact.png`, `layout-dense.png`, `layout-thin.png`, `layout-futuristic.png`, `layout-modern.png`, `layout-enterprise.png`, `layout-material.png`, `layout-centered.png`, `mobile-classic-nav-open.png`, `mobile-classic.png`, `dark-classy.png` and `dark-modern.png`.

Contents

1. NavigationItem data contract
2. Vertical navigation (`ui-vertical-navigation`)
3. Vertical appearances: default, compact, dense, thin
4. Horizontal navigation (`ui-horizontal-navigation`)
5. Navigation service (`UiNavigationService`)
6. Accessibility and keyboard
7. Acceptance checklist
8. Appendix: how the layouts use navigation

---

## 1. NavigationItem data contract

### 1.1 Interface

Field names and semantics must stay compatible with the existing `src/app/core/navigation/navigation.ts` files and with the code generator in `src/utils/registration.ts`. The generator appends objects with the keys `id`, `title`, `type`, `icon` and `link` to arrays with these exact export names: `defaultNavigation`, `compactNavigation`, `futuristicNavigation` and `horizontalNavigation`.

```ts
import { IsActiveMatchOptions, Params, QueryParamsHandling } from '@angular/router';

export type UiNavigationItemType =
  | 'aside'
  | 'basic'
  | 'collapsable'
  | 'divider'
  | 'group'
  | 'spacer';

export interface UiNavigationItem {
  /** Unique id. Required for 'aside' items to open, and used by getItem/trackBy. */
  id?: string;
  /** Visible label. */
  title?: string;
  /** Second, smaller line under the title. */
  subtitle?: string;
  /** Item kind, see 1.2. */
  type: UiNavigationItemType;
  /** Free data for the app (for example role filtering). The navigation ignores it. */
  permissions?: string[];
  /** Predicate. When it returns true, the item and its subtree are not rendered. */
  hidden?: (item: UiNavigationItem) => boolean;
  /** Forces the "active" look regardless of the router. */
  active?: boolean;
  /** Renders the item dimmed and non-interactive. */
  disabled?: boolean;
  /** Tooltip text (PrimeNG pTooltip). Empty or undefined means no tooltip. */
  tooltip?: string;
  /** Router path (internal) or URL (when externalLink is true). */
  link?: string;
  /** Router fragment for internal links. */
  fragment?: string;
  /** Keep the current fragment on internal navigation. Default false. */
  preserveFragment?: boolean;
  /** Query params for internal links. */
  queryParams?: Params | null;
  /** Query params handling for internal links ('merge' | 'preserve' | ''). */
  queryParamsHandling?: QueryParamsHandling | null;
  /** When true, `link` is a plain href rather than a router link. */
  externalLink?: boolean;
  /** Anchor target for external links. Default '_self'. */
  target?: '_blank' | '_self' | '_parent' | '_top' | string;
  /** Exact route matching for the active state. Default false (subset matching). */
  exactMatch?: boolean;
  /** Full control over active-route matching. Takes priority over exactMatch. */
  isActiveMatchOptions?: IsActiveMatchOptions;
  /** Click handler. It is called with the item, in addition to any navigation. */
  function?: (item: UiNavigationItem) => void;
  /** Extra CSS classes added to parts of the rendered item. */
  classes?: {
    title?: string;
    subtitle?: string;
    icon?: string;
    wrapper?: string;
  };
  /** Icon name in "namespace:name" form, for example 'heroicons_outline:chart-pie'. */
  icon?: string;
  /** Small pill on the trailing side of the item. */
  badge?: {
    title?: string;
    /** Classes for the pill, for example 'px-2 bg-pink-600 text-white rounded-full'. */
    classes?: string;
  };
  /** Child items, used by aside, collapsable and group. */
  children?: UiNavigationItem[];
  /** Free data for the app. */
  meta?: any;
}

export type UiVerticalNavigationAppearance = 'default' | 'compact' | 'dense' | 'thin';
export type UiVerticalNavigationMode = 'over' | 'side';
export type UiVerticalNavigationPosition = 'left' | 'right';
```

To keep existing app code compiling during the migration, also export the type alias `FuseNavigationItem = UiNavigationItem` from a compatibility barrel. This alias is optional and can be removed later. The app-level `Navigation` type (`app/core/navigation/navigation.types.ts`) keeps its four keys, `compact`, `default`, `futuristic` and `horizontal`, and each key holds a `UiNavigationItem[]`.

Note: the mock API that serves `api/common/navigation` copies `children` from `defaultNavigation` into the `compact`, `futuristic` and `horizontal` items that have the same `id`. That mock API belongs to the app and is out of scope here. The navigation components simply render whatever arrays they receive.

### 1.2 Item types

| type | Renders in vertical nav | Renders in horizontal nav | Children |
|---|---|---|---|
| `basic` | Clickable row: icon, title, subtitle, badge. Navigates (router or href) and/or calls `function`. | Clickable top-bar item, or a row inside a dropdown. | Ignored |
| `collapsable` | Row with a trailing chevron. A click expands or collapses its children inline, indented. | Branch: opens a dropdown menu (see section 4). | Rendered when expanded |
| `group` | Non-clickable section header (uppercase, primary color) with its children always listed below it. The icon and badge are not shown. | Branch: opens a dropdown menu. | Always rendered |
| `aside` | Row that opens a side panel (the "aside") next to the navigation, which lists the children. | Branch: opens a dropdown menu. | Rendered only in the aside panel |
| `divider` | 1 px horizontal rule. | Only inside dropdown menus (1 px rule). Ignored at the top level. | No |
| `spacer` | Empty vertical gap (6 px margin top and bottom). | Top level: empty gap (12 px vertical margin). | No |

Rules that apply to all types:

- **Hidden.** If `hidden` is defined and returns true, skip the item and its whole subtree. Evaluate it on every render, because it is a function and may depend on outside state.
- **Track by.** Track items by `id`, or by index when there is no id.
- **Basic item variants.** The variant depends on `link`, `externalLink`, `function` and `disabled`:
  - Internal link (`link` set, not external): a router link that uses `fragment`, `preserveFragment`, `queryParams` and `queryParamsHandling`, and gets an active state from the router (section 2.4).
  - External link: a normal `<a href>` with `target` (default `_self`). It never shows an active state from the router.
  - `function` set: clicking calls `function(item)`. If a link is also set, navigation happens too.
  - No link and no function: a non-navigating row. It still shows hover styles.
  - `disabled`: a non-interactive row at 40% opacity. It has no link and no function call, but it keeps its tooltip.
  - `active: true` forces the active look in every variant except disabled.

---

## 2. Vertical navigation: `ui-vertical-navigation`

### 2.1 Public API (proposed)

```ts
@Component({ selector: 'ui-vertical-navigation', exportAs: 'uiVerticalNavigation', ... })
export class UiVerticalNavigation {
  // inputs
  readonly navigation   = input<UiNavigationItem[]>([]);
  readonly name         = input<string>('');                 // '' => auto-generated random id
  readonly appearance   = input<UiVerticalNavigationAppearance>('default');
  readonly mode         = input<UiVerticalNavigationMode>('side');
  readonly position     = input<UiVerticalNavigationPosition>('left');
  readonly opened       = model<boolean>(true);              // booleanAttribute-compatible
  readonly autoCollapse = input<boolean>(true);
  readonly inner        = input<boolean>(false);
  readonly transparentOverlay = input<boolean>(false);

  // outputs
  readonly appearanceChanged = output<UiVerticalNavigationAppearance>();
  readonly modeChanged       = output<UiVerticalNavigationMode>();
  readonly positionChanged   = output<UiVerticalNavigationPosition>();
  readonly openedChanged     = output<boolean>();

  // read-only state
  readonly activeAsideItemId: Signal<string | null>;
  readonly hovered: Signal<boolean>;

  // methods
  open(): void;
  close(): void;
  toggle(): void;
  openAside(item: UiNavigationItem): void;
  closeAside(): void;
  toggleAside(item: UiNavigationItem): void;
  refresh(): void;   // re-render after the caller mutated items in place (for example a badge title)
}
```

Notes:

- `opened` is a model, so it supports one-way binding (`[opened]`) and two-way binding (`[(opened)]`). Every internal open or close (toggle, backdrop click, route change in over mode) updates the model and emits `openedChanged`. When the parent changes the bound value, the component applies it as if `open()` or `close()` had been called.
- `transparentOverlay` is the "transparent" option. When it is true, the backdrop in over mode is fully transparent but still catches clicks.
- `appearanceChanged`, `modeChanged` and `positionChanged` emit whenever the matching input value changes, including the first value.
- `refresh()` must make every nested item re-render. A simple way is a version signal that the item templates read.
- Register in `UiNavigationService` under `name` on init, and deregister on destroy (section 5). If `name` is empty, generate a random id.

### 2.2 Host states and layout

Expose the state on the host element as classes, so the appearance styles and the app can target them. Proposed class names:
`ui-vnav-appearance-{default|compact|dense|thin}`, `ui-vnav-mode-{side|over}`, `ui-vnav-position-{left|right}`, `ui-vnav-opened`, `ui-vnav-inner`, `ui-vnav-hover` and `ui-vnav-animations-enabled`.

Geometry (default appearance):

- The host is a flex column with `flex: 1 0 auto`. Width, min-width and max-width are all equal to the appearance width (default **280 px**). Height is `100vh`. Position is `sticky` with `top: 0`. z-index is **200**.
- The host background and text color come from the classes that the layout puts on the host (see appendix). The component does not set its own background. Inner parts inherit it (`background: inherit`), and text uses `currentColor`.
- Inside the host there is a **wrapper**: an absolutely positioned full-size flex column with `overflow: hidden` and z-index 10. It has a 1 px inner right edge line in the theme border color (light: slate-200; dark: slate-100 at 12% alpha). Draw it as an inset box-shadow so it does not change the width.
- The wrapper contains, from top to bottom:
  1. **Header slot.** Fixed. It does not scroll.
  2. **Content area.** `flex: 1 1 auto`, vertical scrolling, horizontal overflow hidden, `overscroll-behavior: contain`. It holds:
     - the **content header slot** (scrolls with the items),
     - the items,
     - the **content footer slot** (scrolls with the items).
  3. **Footer slot.** Fixed. It does not scroll.
- Content projection selectors: `[uiVerticalNavigationHeader]`, `[uiVerticalNavigationContentHeader]`, `[uiVerticalNavigationContentFooter]` and `[uiVerticalNavigationFooter]`. Each slot container is present even when it is empty, and has no padding of its own.
- Scrollbar: the current app uses a thin custom scrollbar. Use a thin native scrollbar (for example the `scrollbar-width: thin` style, about 6 px wide, thumb in the theme border color), or PrimeNG ScrollPanel. When `inner` is false, wheel scrolling must not propagate to the page when the content reaches its scroll end.
- **Visibility.** When closed, the host has `visibility: hidden` after the transition. The visibility change must be part of the transition, so the slide-out stays visible while it plays.

Side mode (`mode = 'side'`):

- Opened: the host takes up its width in the layout's flex row.
- Closed: the host gets a negative margin on its own side (`margin-left: -width` for position left, `margin-right: -width` for position right). The page content then slides over and fills the space.

Over mode (`mode = 'over'`):

- The host is `position: fixed`, with `top: 0`, `bottom: 0` and `left: 0` (or `right: 0`).
- Closed: translated fully off-screen, `translateX(-100%)` for left or `+100%` for right. Opened: `translateX(0)`.
- On open, show a **backdrop** (2.6) and lock page scroll.
- On every router `NavigationEnd` while opened: close.

Position right mirrors everything above: the margins, the translation, which side the aside panel opens on, and the edge line.

Inner mode (`inner = true`), used to embed the navigation inside page content (for example a settings sidebar):

- The host is `position: relative`, with automatic width and height, no min/max width or height, and no shadow.
- The wrapper is `position: relative` with `overflow: visible` and automatic height. The content area does not scroll; the page scrolls instead.

Transitions on the host and wrapper:

- Properties: visibility, margin-left, margin-right, transform, width, min-width and max-width.
- Duration **400 ms**, easing **cubic-bezier(0.25, 0.8, 0.25, 1)**.
- Animations are **disabled** at first render, so the drawer does not slide in on page load. They are enabled by the first mouseenter or mouseleave on the host, or by the first call to open, close or toggle.
- When `mode` changes, disable animations, apply the new mode, then enable them again after **500 ms**. This stops a visible slide when the layout switches between desktop and mobile.

Hover tracking: mouseenter on the host sets `hovered` to true, and mouseleave sets it to false. The dense appearance uses this state.

Other behavior:

- **Initial scroll.** After the first render, if an active item exists, scroll the content area so that the item is visible, about 120 px below the top of the content area. Do not animate this scroll.
- **Page scroll lock compensation.** While page scroll is locked (over mode), the navigation must not jump. If the lock works by fixing the `<html>` element with a negative `top`, add the same offset back on the host as `margin-top`, and remove it when the lock ends.
- **Destroy.** Close the navigation and the aside, remove any backdrops, release the scroll lock and deregister from the service.

### 2.3 Methods

- `open()`: does nothing if already opened. Otherwise it sets opened to true, enables animations, shows the backdrop in over mode, emits `openedChanged(true)` and updates the model.
- `close()`: does nothing if already closed. Otherwise it closes the aside first, then sets opened to false, hides the backdrop in over mode and emits `openedChanged(false)`.
- `toggle()`: calls `open()` or `close()`, depending on the current state.
- `openAside(item)`: does nothing if `item.disabled` is true or `item.id` is missing. Otherwise it sets `activeAsideItemId = item.id` and shows the aside backdrop (2.6).
- `closeAside()`: clears `activeAsideItemId` and hides the aside backdrop.
- `toggleAside(item)`: closes the aside when `item.id` is already the open one. Otherwise it opens it, which replaces any aside that is already open.

Mode transitions:

- From over to side: hide the backdrop and release the scroll lock.
- From side to over: close the aside. If the navigation is currently opened, show the backdrop.

### 2.4 Active link matching

- Each basic item with an internal link gets an "active" state from the router. Use `RouterLinkActive` or the equivalent `Router.isActive`, with these options:
  - **Exact** (`exactMatch: true`): paths `exact`, queryParams `exact`, fragment `ignored`, matrixParams `ignored`.
  - **Partial** (default): paths `subset`, queryParams `subset`, fragment `ignored`, matrixParams `ignored`.
  - If `isActiveMatchOptions` is given, use it as is. It takes priority over `exactMatch`.
- `active: true` on the item forces the same look without the router.
- External links and disabled items are never router-active.

### 2.5 Behavior per item type (vertical)

**Basic**: see 1.2. It renders as an anchor for links and as a button-like element for function-only items.

**Collapsable**:

- State: collapsed or expanded. Expose it on the item host, for example `ui-vnav-item-expanded` and `ui-vnav-item-collapsed`.
- A click on the header row toggles the state. A disabled collapsable ignores the click and does not change state.
- **Initial state.** Expanded if any descendant (at any depth) has a `link` that is active according to the router. The check uses the descendant's own `exactMatch`, defaulting to partial matching. Otherwise it is collapsed.
- **On every `NavigationEnd`.** Expand if the item has an active descendant. Otherwise, collapse it if `autoCollapse` is true. If `autoCollapse` is false, leave it as it is.
- **When a collapsable expands and `autoCollapse` is true**, every other collapsable in the same navigation instance collapses, unless one of these applies:
  - it is an ancestor of the item that expanded,
  - it contains the currently active route,
  - it is the item that expanded.
- **When a collapsable collapses**, every collapsable nested inside it collapses too. This happens even when `autoCollapse` is false.
- **Animation.** Height animates from 0 to auto on expand and from auto to 0 on collapse. Duration **225 ms**, easing **cubic-bezier(0, 0, 0.2, 1)**. The children container has `overflow: hidden`. Skip the animation on first render.
- **Chevron.** A `heroicons_solid:chevron-right` icon, 16x16 px, aligned to the trailing edge (margin-left auto). If there is a badge, the chevron has an 8 px gap after it. On expand, the chevron rotates **90deg** (it points down). The transform transition is **300 ms cubic-bezier(0.25, 0.8, 0.25, 1)** and the color transition is 375 ms with the same curve.
- **Expanded header styling.** The icon, title, subtitle and chevron are at 100% opacity. There is no background unless the header is hovered.
- A collapsable never shows the router "active" background itself, even when a child is active. It is only expanded.
- Children can be basic, collapsable, divider, group or spacer. Aside items are not allowed inside a collapsable.
- **Child indentation.** These are the left paddings of the item row, by nesting depth inside collapsables:
  - depth 1: **56 px**
  - depth 2: **72 px**
  - depth 3: **88 px**
  - depth 4 and deeper: **104 px**

  Right padding stays 16 px and vertical padding stays 10 px. Because the icon is 24 px with a 16 px gap after it, a child title lines up with the parent title at depth 1.
- **Children spacing.** The first child has an extra **6 px** margin-top, and the last child has an extra **6 px** padding-bottom, which is not doubled for nested last children.

**Group**:

- The header row is not interactive: no hover, no pointer cursor, no active state. The icon and badge are hidden.
- Title: 12 px, weight 600, uppercase, letter-spacing 0.05em (0.6 px), line-height 20 px, opacity 100%. Color is **primary-600** on light backgrounds and **primary-400** on dark backgrounds. With the default indigo theme, that is indigo-600 `rgb(79,70,229)` or indigo-400 `rgb(129,140,248)`.
- Subtitle: 11 px, line-height 1.5, weight 500, `currentColor` at 50% opacity.
- The children are always rendered directly after the header, at the same indentation level as top-level items (no extra indent).
- A top-level group has **24 px** margin-top.

**Aside**:

- In the main list, it renders like a basic row. Its children are **not** rendered inline.
- A click calls `toggleAside(item)`.
- It shows the **active** look (same as an active basic item) when:
  - its id equals `activeAsideItemId`, or
  - any *basic* descendant (at any depth) has a link that is active according to the router.

  Re-evaluate this on `NavigationEnd` and whenever `activeAsideItemId` changes.
- **Aside panel**, shown while `activeAsideItemId` is set:
  - It is a second column placed directly beside the navigation: at `left = <current appearance width>` for position left, or `right = <width>` for position right.
  - Width **280 px**, full height, vertical scroll, background inherited from the navigation host.
  - z-index 5, below the wrapper's 10, so it appears to slide out from behind the navigation.
  - Content: only the open aside's **children**, rendered with the normal vertical item rules (groups, collapsables, basics, and so on). The aside's own header row is not repeated. The panel has 24 px padding at the top and bottom.
  - Enter animation: from `translateX(-100%)` with opacity 0 to its final place with opacity 1, over **225 ms** with **cubic-bezier(0, 0, 0.2, 1)**. For position right it comes from +100%.
  - Leave animation: the reverse, over **195 ms** with **cubic-bezier(0.4, 0, 1, 1)**.
  - When the panel's `left` or `right` changes, for example in dense when the navigation expands on hover, transition it over 400 ms with cubic-bezier(0.25, 0.8, 0.25, 1).
- The aside closes when:
  - the user clicks the aside backdrop,
  - the user clicks the same aside item again,
  - the navigation closes,
  - the mode changes from side to over,
  - a `NavigationEnd` happens in side mode.

**Divider**: a 1 px line in the theme border color, full width of the navigation with no side inset. A top-level divider has **24 px** margin above and below. A nested divider has **12 px**.

**Spacer**: an empty block with **6 px** margin above and below.

### 2.6 Backdrops

- **Over-mode backdrop.**
  - It is created when the navigation opens in over mode, and inserted into the navigation's parent element as a sibling.
  - It is positioned absolutely with `inset: 0` and z-index **170**, so it sits below the navigation's 200.
  - Color `rgba(0,0,0,0.6)`, or transparent when `transparentOverlay` is true.
  - It fades from opacity 0 to 1 over **300 ms cubic-bezier(0.25, 0.8, 0.25, 1)**. It fades out the same way and is removed when the fade-out finishes.
  - A click on it closes the navigation.
  - Page scroll is locked while it is present (use the CDK `ScrollStrategyOptions.block()` or an equivalent). The lock is released after the fade-out.
  - See `mobile-classic-nav-open.png`.
- **Aside backdrop.**
  - It is created when an aside opens, as a sibling in the same parent, with `inset: 0` and z-index **169**.
  - Color `rgba(0,0,0,0.3)`, with the same 300 ms fade.
  - A click on it closes the aside.
  - If the over-mode backdrop is also present, the aside backdrop is transparent, so the darkening does not stack.
- Only one backdrop of each kind can exist at a time.
- Implementation hint: you can render both backdrops from the component's own template with `position: fixed` and `inset: 0` instead of inserting them into the parent. They must still sit below the navigation and above the page, and a click must still close the drawer or the aside.

### 2.7 Common item row anatomy and metrics (default appearance)

An item host is a flex column with `flex: 1 0 auto` and `user-select: none`. Inside it:

- **Row wrapper.** Horizontal margin **12 px** on each side for basic, aside, collapsable and group items. So in a 280 px navigation, a row is 256 px wide and starts 12 px from the edge.
- **Row** (`.item`):
  - flex row, centered vertically, aligned left, `position: relative`
  - padding **10 px 16 px**
  - border-radius **6 px**
  - font-size **13 px**, weight **500**, line-height **20 px**
  - no text decoration
  - color `currentColor`
- Basic, aside and collapsable hosts have **4 px** margin-bottom and a pointer cursor on the row.
- **Row height.** **44 px** with only a title (24 px icon plus 10 + 10 px padding). About **56.5 px** with a subtitle. Rows without an icon are 40 px (20 px title line plus padding).
- **Icon.** 24x24 px, margin-right **16 px**, `currentColor` at **60%** opacity.
- **Title.** `currentColor` at **80%** opacity. It wraps when it is long.
- **Subtitle.** 11 px, line-height 1.5 (16.5 px), weight 500, `currentColor` at **50%** opacity, shown under the title.
- **Badge.** Placed on the trailing edge (margin-left auto). The pill has height **20 px**, font-size **10 px**, weight **600**, no wrapping, and centers its content. The color, padding and radius come from `badge.classes`, for example `px-2 bg-pink-600 text-white rounded-full`, which gives an 8 px horizontal padding and a full radius.
- **`classes` hooks.**
  - `classes.wrapper` is added to the row wrapper.
  - `classes.icon` is added to the icon.
  - `classes.title` and `classes.subtitle` are added to an inner span of the title and subtitle.

States for basic, aside and collapsable rows:

| State | Background | Icon | Title | Subtitle | Other |
|---|---|---|---|---|---|
| Normal | none | 60% | 80% | 50% | |
| Hover (not active, not disabled) | light: slate-800 at 5% alpha (`rgba(30,41,59,0.05)`); dark: white at 12% (`rgba(255,255,255,0.12)`) | 100% | 100% | 100% | Chevron at 100% |
| Active (router or forced) | same as hover | 100% | 100% | 100% | |
| Expanded collapsable | none | 100% | 100% | 100% | Chevron rotated 90deg |
| Disabled | none | inherits | inherits | inherits | Whole row at **40%** opacity, default cursor, no hover |

"Light" and "dark" refer to the theme context of the navigation host. Most layouts force a dark context on the navigation with a `dark` class (see the appendix), so the white-at-12% values apply there. The hover and active backgrounds change instantly; no background transition is required.

Measured values from the classic layout (dark, slate-900 background `rgb(15,23,42)`):
- row: 256x44 at x = 12
- icon: 24 px at x = 28
- title: starts at x = 68
- active background: `rgba(255,255,255,0.12)`
- group title color: `rgb(129,140,248)`
- divider and edge line color: `rgba(241,245,249,0.12)`
- badge: 20 px tall, 10 px/600

---

## 3. Vertical appearances

All appearances share section 2. Only the differences are listed here. The navigation width drives the side-mode negative margin and the aside panel offset, so every width below applies to those too. Define the widths as CSS custom properties on `:root`, so apps can override them:

- `--ui-vnav-width: 280px`
- `--ui-vnav-compact-width: 112px`
- `--ui-vnav-dense-width: 80px`
- `--ui-vnav-thin-width: 80px`

### 3.1 Default

- Width **280 px**.
- Metrics are as in 2.7.
- References: `layout-classic.png`, `layout-classy.png`, `layout-futuristic.png`, `mobile-classic-nav-open.png`.

### 3.2 Compact

- Width **112 px**. The aside panel opens at `left: 112px`.
- Designed for a flat top-level list of `basic` and `aside` items. In compact layouts, the nested content lives in aside panels. See `layout-compact.png`.
- **Top-level** basic and aside items:
  - Row wrapper margin: **4 px top, 8 px left and right**, 0 bottom. Row box: **96 px** wide.
  - Row: column direction, centered, padding **12 px**, radius **6 px**. Height is **72 px** for a one-line title (12 + 24 icon + 8 + 16 + 12).
  - Icon: 24 px, no right margin.
  - Title: **8 px** margin-top, **12 px**, weight **500**, line-height **16 px**, centered. Long titles wrap.
  - Subtitle: hidden.
  - Badge: absolutely positioned at **top 12 px, left 64 px** of the row (over the icon's top-right corner).
- The host keeps the 4 px margin-bottom, so consecutive top-level items have 8 px between them.
- Hover, active and disabled colors are the same as in the default appearance.
- Top-level collapsable items and group headers do not fit this appearance. The implementer should **hide top-level collapsable items** and **hide the header row of top-level groups** (their children still render), the same as in thin.
  - Open question: in the reference, the compact appearance did not actually hide them; it just squeezed them.
- Items inside the aside panel use the default (280 px) row metrics.

### 3.3 Dense

- Collapsed width **80 px** in side mode. In over mode the dense appearance behaves exactly like default (280 px, everything visible). The dense layout also switches the appearance to `default` on small screens.
- The aside panel opens at `left: 80px`, or at `left: 280px` while the navigation is hovered.
- Every row, at any depth, is **56 px** wide (`dense width - 24`) and keeps its 12 px side margins.
- **Collapsed state** (not hovered, not over mode). See `layout-dense.png`.
  - Row padding stays 10 px 16 px, so only the 24 px icon shows, centered in the 56 px row.
  - The title wrapper, badge and chevron have **opacity 0** and `white-space: nowrap`.
  - The children of collapsables are not displayed.
  - Group header rows show a short horizontal line in place of the title:
    - **23 px** wide
    - **2 px** top border in the theme border color
    - absolutely positioned **20 px** from the top of the row, starting at the row's left padding
    - The group title text is hidden (opacity 0), but the row keeps its height.
  - The first top-level group has margin-top **0**. Other groups keep 24 px.
- **Hover-expanded state.**
  - On host mouseenter, the **wrapper** (not the host) widens to **280 px** and overlays the page content. The host stays at 80 px, so the page does not reflow.
  - Rows widen to **256 px**.
  - The title wrapper, badge and chevron fade to visible over **400 ms cubic-bezier(0.25, 0.8, 0.25, 1)**. They keep `white-space: nowrap` for the first **350 ms** and switch to normal wrapping after that, so text does not reflow while the width animates.
  - Collapsable children display again.
  - The group line disappears and the normal group title shows.
- The width transition uses the 400 ms host and wrapper transition from 2.2.
- A toggle button in the dense layout header switches between `dense` and `default` (section 8).

### 3.4 Thin

- Width **80 px**. The aside panel opens at `left: 80px`.
- Icon-only navigation. See `layout-thin.png`.
- **Top-level** basic and aside hosts:
  - Height fixed at **64 px**, padding **0 16 px**, contents centered vertically and horizontally.
  - The row wrapper is centered. The row is centered, with padding **12 px** and radius **4 px**, which gives a **48x48 px** square.
  - Icon: 24 px, no margin.
  - Title, subtitle, badge pill and chevron: not displayed.
- Top-level collapsable items are **hidden**. The header row of top-level groups is **hidden**; the group's children still render with default metrics, which is not recommended for thin data.
- In the reference layout, the thin navigation uses the card background (white in light theme, slate-900 in dark). Light hover and active background: `rgba(30,41,59,0.05)`. Dark: `rgba(255,255,255,0.12)`. Text color is the default text color, slate-800 in light theme.
- Tooltips: because titles are hidden, the item's `title` should be used as a tooltip (position right) when `tooltip` is not set. This is a recommended improvement; the reference relies only on `tooltip`.

---

## 4. Horizontal navigation: `ui-horizontal-navigation`

### 4.1 Public API (proposed)

```ts
@Component({ selector: 'ui-horizontal-navigation', exportAs: 'uiHorizontalNavigation', ... })
export class UiHorizontalNavigation {
  readonly navigation = input<UiNavigationItem[]>([]);
  readonly name       = input<string>('');   // '' => random id
  refresh(): void;
}
```

It registers in `UiNavigationService` under `name` on init and deregisters on destroy.

### 4.2 Item types at the top level

The top level is one row of items, laid out with flex and centered vertically.

- `basic`: a clickable item with the variants from 1.2.
- `aside`, `collapsable`, `group`: rendered as **branch** items. A click toggles a dropdown menu with the children. Disabled branches do not open.
- `spacer`: an empty gap with 12 px vertical margin.
- `divider`: ignored at the top level.
- `hidden` items are skipped.

### 4.3 Top-level item visuals

Measured in the modern and enterprise layouts. See `layout-modern.png` and `layout-enterprise.png`.

- **Row wrapper.** Radius **4 px**, `overflow: hidden`.
- **Item.**
  - flex row, centered vertically
  - min-height **48 px**, or **56 px** when it has a subtitle
  - padding **0 16 px**
  - font-size **13 px**, weight **500**
  - pointer cursor, `user-select: none`, no text decoration
- **Icon.** 24 px, margin-right **12 px**, `currentColor`, full opacity.
- **Title.** Default text color (slate-800 in light theme), full opacity.
- **Subtitle.** 12 px, in the theme's hint text color (slate-400 in light theme, slate-500 in dark).
- **Badge.** Same pill rules as in vertical: 20 px tall, 10 px/600, trailing, colors from `badge.classes`.
- **Hover** (at the `sm` breakpoint, 600 px, and wider): the wrapper background is the theme hover color, light **slate-400 at 12%** (`rgba(148,163,184,0.12)`) or dark **white at 5%**.
- **Active basic item** (router or forced):
  - title and icon in **primary** (indigo-600 `rgb(79,70,229)` in the default theme)
  - subtitle in primary-400 (light theme) or primary-600 (dark theme)
  - no background change
- **Open branch:** the wrapper keeps the hover background while its menu is open.
- **Disabled:** 40% opacity, no hover, does not open.
- In the reference, the bar is 56 px tall: the layout gives it a 64 px row, and the 48 px items are centered.

### 4.4 Dropdown menus (branches)

> Reference note: in the current reference app, branch items in the horizontal navigation fail at runtime. The template uses an overlay component that is not imported. Only flat lists of `basic` items render today (that is what all the starter data contains). There is therefore no live visual for menus. The spec below defines the intended behavior and look.

- **Recommended implementation.** PrimeNG **`p-tieredmenu` in popup mode** (`[popup]="true"`), opened with `toggle(event)` from the branch item, with a custom item template, so the rows look like the rows below.
  - Map `UiNavigationItem` to `MenuItem`:
    - `label` = title
    - `routerLink` = link, plus `queryParams`, `fragment`, `queryParamsHandling` and `preserveFragment`
    - `url` and `target` = link and target for external links
    - `command` calls `function(item)`
    - `disabled` = disabled
    - `visible` = !hidden(item)
    - `items` = mapped children
    - `separator: true` for a divider
    - `tooltip` = tooltip
  - Keep the original item on the `MenuItem`, for example in a `data` property, so the template can render the icon, subtitle and badge.
  - Nested branches (aside, collapsable or group inside a menu) open as **flyout submenus** to the side.
  - `p-menu` (popup) is acceptable for menus that are only one level deep.
- **Opening and closing.**
  - A click on a top-level branch toggles its menu, anchored under the item and aligned to its left edge.
  - A click outside, Escape, or choosing a leaf item closes all menus.
  - Only one top-level menu can be open at a time.
  - The branch stays in its "open" visual state while its menu is visible. Track this with the menu's show and hide events.
- **Menu panel.**
  - theme surface background (card color: white in light theme, slate-800 in dark)
  - radius **6 px**
  - PrimeNG overlay shadow
  - vertical padding **8 px**
  - min-width **192 px**, max-width **320 px**
- **Menu rows.**
  - flex row, min-height **48 px**, or **56 px** with a subtitle
  - padding **0 16 px**
  - 13 px / 500
  - icon 24 px with a 12 px gap
  - title wraps (normal white-space, auto height)
  - subtitle 12 px in the hint color
  - badge trailing
  - submenu indicator chevron (chevron-right, 16 px) trailing on branch rows
  - hover background: the theme hover color
  - an active (router-matched) basic row uses the primary color for the title and icon, the same as the top level
  - disabled rows at 40% opacity
- **Dividers in menus.** A 1 px line in the theme border color, with 8 px vertical margin, spanning the full panel width (it ignores the row padding).
- **Group inside a menu.** It acts as a branch that opens its children as a submenu. This matches the reference intent, where group, aside and collapsable all behave the same in horizontal mode.

---

## 5. Navigation service: `UiNavigationService`

`@Injectable({ providedIn: 'root' })`. Proposed API:

```ts
export class UiNavigationService {
  // component registry
  registerComponent(name: string, component: UiVerticalNavigation | UiHorizontalNavigation): void;
  deregisterComponent(name: string, component?: unknown): void;
  getComponent<T = UiVerticalNavigation | UiHorizontalNavigation>(name: string): T | undefined;

  // optional navigation store (key -> items)
  storeNavigation(key: string, navigation: UiNavigationItem[]): void;
  getNavigation(key: string): UiNavigationItem[];        // [] when missing
  deleteNavigation(key: string): void;                   // console.warn when key missing, then no-op

  // tree utilities (pure)
  getFlatNavigation(navigation: UiNavigationItem[], flat?: UiNavigationItem[]): UiNavigationItem[];
  getItem(id: string, navigation: UiNavigationItem[]): UiNavigationItem | null;
  getItemParent(id: string, navigation: UiNavigationItem[], parent: UiNavigationItem[] | UiNavigationItem):
    UiNavigationItem[] | UiNavigationItem | null;
}
```

Semantics:

- **registerComponent.** Stores the instance under `name`. If the name already exists, the new instance replaces the old one. Navigation components call this on init.
- **deregisterComponent.** Removes the entry. Recommended improvement: when `component` is passed, remove the entry only if it is still that same instance. This prevents a race in the horizontal layouts, where a vertical and a horizontal navigation both use the name `'mainNavigation'` and swap on breakpoint changes (one is created before the other is destroyed).
- **getComponent.** Returns the registered instance or `undefined`. Callers must handle `undefined`.
- **getFlatNavigation.** Walks the tree depth-first, in order, and returns only `basic` items.
  - It recurses into the `children` of `aside`, `collapsable` and `group` items.
  - It does not recurse into children of `basic` items.
  - `divider` and `spacer` items are dropped.
  - If `flat` is passed, it appends to that array and returns it.
- **getItem.** Depth-first search, in order. It returns the first item whose `id` equals `id`, or `null`.
- **getItemParent.** Returns the item that directly contains the item with `id`. For a top-level match it returns the `parent` argument, which is usually the root array. It returns `null` if the id is not found.
- **storeNavigation, getNavigation, deleteNavigation.** A simple in-memory map for apps that want to keep several navigation trees. The starter does not use it, but keep it for compatibility.

How the layouts use it:

- Every layout gives its navigation the name `'mainNavigation'`.
- The header's hamburger button calls the layout's `toggleNavigation('mainNavigation')`. That method looks up the component with `getComponent(name)` and calls `toggle()` on it if it exists.
- Apps can update items at run time. For example, to change a badge count: get the component, find the item with `getItem(id, component.navigation())`, mutate it, and call `component.refresh()`.

---

## 6. Accessibility and keyboard

The reference implementation has almost no accessibility support. The new implementation must at least meet the following, without changing visuals.

Vertical:

- **Landmarks.**
  - The host or the wrapper is a `<nav>`, or has `role="navigation"`, with an `aria-label` (default "Main navigation", configurable through an `ariaLabel` input).
  - The aside panel is a region labelled with the aside item's title.
- **Lists.** Use list semantics for item lists (`role="list"` and `role="listitem"`, or `<ul>` and `<li>`), with styles reset.
- **Basic items.**
  - Internal and external links are real `<a>` elements with `href`. External links with `target="_blank"` get `rel="noopener noreferrer"`.
  - Function-only items are `<button type="button">`.
  - An active router link has `aria-current="page"`.
  - Disabled items are not focusable, and have `aria-disabled="true"`.
- **Collapsable header.** A `<button>` with `aria-expanded` and `aria-controls` pointing to the children container.
  - Enter and Space toggle it.
  - Recommended: ArrowRight expands, and moves focus to the first child if already expanded. ArrowLeft collapses, or moves focus to the parent header.
- **Aside item.** A `<button>` with `aria-expanded` (true while its panel is open) and `aria-controls` pointing to the panel.
  - Enter and Space toggle it.
  - When the panel opens from the keyboard, move focus to its first focusable item.
  - Escape closes the panel and returns focus to the aside item.
- **Group header.** Not focusable. Expose it as a heading or as the label of a `role="group"` (with `aria-labelledby`) that contains its children.
- **Divider.** `role="separator"`. **Spacer.** `aria-hidden="true"`.
- **Over mode.**
  - When opened, move focus into the drawer (first item, or the drawer itself), and trap focus while it is open (CDK `FocusTrap` is fine).
  - Escape closes it.
  - On close, return focus to the element that was focused before it opened, usually the hamburger button.
  - The backdrop is `aria-hidden`.
  - When closed, the drawer must be removed from the tab order (`visibility: hidden` or `inert`).
- **Icon-only appearances** (thin, compact with long titles, collapsed dense). Each item needs an accessible name that equals `title`, for example `aria-label` or visually hidden text. Show a PrimeNG tooltip with the title, on the right side, on hover and focus when no `tooltip` is set.
  - In dense, keyboard focus inside the navigation must also trigger the hover-expanded state (`:focus-within`), so focused labels are readable.
- **Focus ring.** Visible on keyboard focus only (`:focus-visible`): a 2 px ring in primary at about 50% alpha, inset or with a 2 px offset, following the 6 px (4 px in thin) radius.
- **Reduced motion.** Under `prefers-reduced-motion: reduce`, set the drawer slide, aside slide, expand/collapse, backdrop fade and dense expansion durations to 0 ms or near 0.
- **Icons.** Decorative icons have `aria-hidden="true"`.

Horizontal:

- The bar is a `<nav>` with an `aria-label`. Top-level items are links or buttons in tab order.
- Branch buttons have `aria-haspopup="menu"` and `aria-expanded`.
- Inside menus, rely on the PrimeNG TieredMenu keyboard model:
  - arrow keys move between rows
  - ArrowRight and ArrowLeft open and close submenus
  - Enter activates a row
  - Escape closes the menu and returns focus to the trigger
- Active links have `aria-current="page"`.

---

## 7. Acceptance checklist

Data and compatibility

- [ ] `UiNavigationItem` has every field in 1.1 with the same names and meanings. The existing `navigation.ts` files type-check after the import changes from `FuseNavigationItem` to `UiNavigationItem`, or through the alias.
- [ ] `registration.ts` still appends items to the four exported arrays, and nothing in the components depends on keys the generator does not write.
- [ ] `hidden(item)` returning true removes the item and its subtree, both vertical and horizontal.

Vertical: structure and modes

- [ ] Default width 280 px, sticky, full height, z-index 200, 1 px inner edge line in the border color.
- [ ] The header and footer slots stay fixed. The content header and content footer slots scroll with the items.
- [ ] Side mode: closing slides the navigation out with a negative margin (400 ms, cubic-bezier(0.25,0.8,0.25,1)), and the page content fills the space.
- [ ] Over mode: fixed drawer, translateX off-screen when closed. Opening shows a 60% black backdrop (z-index 170, 300 ms fade). A backdrop click closes it, page scroll is locked while it is open, and route changes close it.
- [ ] `transparentOverlay` makes the backdrop invisible but still clickable.
- [ ] Position right mirrors margins, transforms and the aside side.
- [ ] Inner mode: no fixed size, no internal scroll.
- [ ] No slide animation on first page load. No animation while the mode changes (500 ms suppression).
- [ ] `open()`, `close()` and `toggle()` work through `UiNavigationService.getComponent('mainNavigation')`, `openedChanged` emits, and the `opened` model updates.
- [ ] The active item is scrolled into view after the first render.

Vertical: items

- [ ] Row: 12 px side margins, 10x16 padding, 6 px radius, 13/500/20, 24 px icon with 16 px gap, opacities 60% (icon), 80% (title) and 50% (subtitle). Height 44 px, or about 56.5 px with a subtitle. Basic, aside and collapsable rows have 4 px between them.
- [ ] Hover and active background: dark white/12%, light slate-800/5%. Icon, title and subtitle go to 100%.
- [ ] Disabled rows at 40% opacity, not clickable, no hover.
- [ ] Partial matching by default. `exactMatch` gives exact matching. `isActiveMatchOptions` overrides both. `active: true` forces the look.
- [ ] Collapsable: the chevron rotates 90deg (300 ms), the height animates (225 ms). A parent of the active route auto-expands on load and on navigation. `autoCollapse` collapses siblings when one expands and collapses others on navigation. Collapsing a parent collapses its descendants.
- [ ] Indentation 56, 72, 88 and 104 px by depth. 6 px extra at the top and bottom of child blocks.
- [ ] Group: uppercase 12/600, letter-spacing 0.05em, primary-600 (light) or primary-400 (dark), no icon or badge, 24 px top margin at the top level.
- [ ] Divider: 1 px border color, 24 px margins at the top level and 12 px nested. Spacer: 6 px margins.
- [ ] Badge: 20 px pill, 10/600, trailing, classes from data.
- [ ] Aside: the click toggles a 280 px panel beside the navigation (225 ms in, 195 ms out), and a 30% black backdrop (z-index 169) closes it. The aside item shows as active while open or while a basic descendant is router-active. The panel closes on route change in side mode, on navigation close, and on a switch to over mode.

Appearances

- [ ] Compact: 112 px; top-level items are 96 px wide, stacked icon over a 12/500/16 centered title, 12 px padding, 4/8 px margins, badge at (12, 64). Matches `layout-compact.png`.
- [ ] Dense: 80 px icon rail with 56 px rows and hidden labels; group headers become a 23x2 px line. On hover the wrapper expands to 280 px over the content (the host stays 80 px) and labels fade in (400 ms). The aside panel follows the edge. In over mode it looks like default. Matches `layout-dense.png`.
- [ ] Thin: 80 px, 64 px-tall top-level slots with 48x48 icon buttons (radius 4 px), no labels; top-level collapsables and group headers hidden. Matches `layout-thin.png`.
- [ ] Widths can be overridden through CSS custom properties.

Horizontal

- [ ] Basic items: 48 px min-height (56 px with subtitle), 0x16 padding, 13/500, 24 px icon with 12 px gap, 4 px radius. Hover is the theme hover background (slate-400/12% light, white/5% dark). Active means primary title and icon. Matches `layout-modern.png` and `layout-enterprise.png`.
- [ ] Aside, collapsable and group items open a popup TieredMenu with icon, subtitle and badge rows (48 or 56 px), dividers, and nested flyouts. The branch keeps the hover background while its menu is open. Disabled branches do not open.
- [ ] Spacer gives a gap. Top-level dividers are ignored.

Service

- [ ] register, getComponent and deregister by name. Deregistering a stale instance does not remove a newer one.
- [ ] `getFlatNavigation` returns only basic items, in depth-first order, recursing through aside, collapsable and group.
- [ ] `getItem` and `getItemParent` behave as in section 5.

Accessibility

- [ ] All items in section 6 are present: landmarks, `aria-current`, `aria-expanded`, focus management in over mode and for the aside, Escape handling, accessible names for icon-only items, focus-visible ring, and reduced motion.

Technical

- [ ] Standalone, OnPush, zoneless-safe: every state change goes through signals, with no reliance on zone.js. The router, hover and backdrop listeners update signals.
- [ ] No `@angular/animations` dependency is required. CSS transitions, or the Angular 20 `animate.enter` and `animate.leave`, are fine.
- [ ] No imports from `@fuse/*`.

---

## 8. Appendix: how the layouts use navigation

This summary covers only the navigation bindings. Breakpoints come from the Tailwind config: sm 600, md 960, lg 1280, xl 1440 px. Each layout computes `isScreenSmall` as "the `md` breakpoint (960 px) does not match". The **layout** decides `mode` and `opened` from this value; the navigation never watches media queries itself.

| Layout | Navigation used | Host classes (background and theme) | appearance | mode | opened | Data key | Slots used |
|---|---|---|---|---|---|---|---|
| classic | vertical | `dark bg-gray-900` (slate-900) | default | small ? over : side | !small | `default` | content header: logo |
| classy | vertical | `dark bg-gray-900` | default | small ? over : side | !small | `default` | content header: logo, notifications, user menu, 96 px avatar, name and email; content footer: logo at 12% opacity |
| compact | vertical | `dark bg-gray-900` | compact | small ? over : side | !small | `compact` | content header: logo |
| dense | vertical | `dark bg-gray-900` | `dense` on desktop and `default` on small screens, plus a header toggle button (arrows-right-left icon, hidden below md) that switches between dense and default | small ? over : side | !small | `default` | content header: logo |
| futuristic | vertical | `dark bg-indigo-800 text-white` | default | small ? over : side | !small | `futuristic` | header (fixed): logo; footer (fixed): user block |
| thin | vertical | `bg-card dark:bg-gray-900` (light nav) | thin | small ? over : side | !small | `compact` | content header: logo |
| centered, enterprise, material, modern | horizontal on desktop; vertical drawer on small screens only | vertical: `dark bg-gray-900` | default | `over` (fixed) | `false` (opened by the hamburger) | horizontal: `horizontal`; vertical: `default` | vertical: content header with logo |

In all layouts:

- Every navigation uses the name `'mainNavigation'`. In the horizontal layouts, the horizontal and vertical navigations are never rendered at the same time; the layout swaps them on the breakpoint.
- All navigation hosts also get `print:hidden`.
- The hamburger in the header calls `getComponent('mainNavigation')?.toggle()`.

Open points for the implementer:

1. **Active match quirk.** When an item defines `isActiveMatchOptions`, the reference ends up applying exact matching instead of the given options, because of an operator-precedence slip. This spec asks for the intended behavior: use the given options. No starter data uses this field, so there is no visual change.
2. **Horizontal branch menus.** These are broken in the reference at run time (section 4.4), so the menu panel metrics in 4.4 are proposed values, not measured ones.
3. **Compact top-level groups and collapsables.** The reference does not hide them; they get squeezed. The spec recommends hiding them, as thin does (3.2).
4. **Badge colors.** These come only from `badge.classes`. Make sure those Tailwind classes are kept (safelisted) if the data is loaded at run time, because the reference build purges unused classes such as `bg-pink-600`.
