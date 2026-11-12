import { ChangeDetectionStrategy, Component, computed, inject, InjectionToken, input } from '@angular/core'

/** Base path of the sprite files, relative so that it respects `<base href>`. */
export const UI_ICONS_PATH = new InjectionToken<string>('UI_ICONS_PATH', { factory: () => 'assets/icons/' })

/** Optional namespace -> sprite file name. Default rule: underscores become hyphens, plus `.svg`. */
export const UI_ICON_NAMESPACES = new InjectionToken<Record<string, string>>('UI_ICON_NAMESPACES', {
  factory: () => ({}),
})

const DEFAULT_NAMESPACE = 'heroicons_outline'

/**
 * One icon from an SVG sprite (`namespace:name`, e.g. `heroicons_outline:bell`) or
 * from an icon font class list (`pi pi-expand`). Size it with Tailwind `size-*` on the host; font icons also need a `text-*` size.
 */
@Component({
  selector: 'ui-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-icon',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label()',
  },
  template: `
    @if (href(); as href) {
      <svg aria-hidden="true" focusable="false"><use [attr.href]="href" /></svg>
    } @else if (icon()) {
      <span aria-hidden="true" [class]="icon()"></span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.5rem;
      font-size: 1.5rem;
      line-height: 1;
    }

    :host:empty {
      width: 0;
      height: 0;
    }

    svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
      stroke: currentColor;
    }

    span {
      font-size: inherit;
      line-height: 1;
    }
  `,
})
export class UiIconComponent {
  private readonly path = inject(UI_ICONS_PATH)
  private readonly namespaces = inject(UI_ICON_NAMESPACES)

  /** Sprite icon as `namespace:name`; without a namespace `heroicons_outline` is used. */
  readonly svgIcon = input<string | null | undefined>(null)
  /** Font icon classes, used only when `svgIcon` is empty. */
  readonly icon = input<string | null | undefined>(null)
  /** Accessible label; without it the icon is decorative. */
  readonly label = input<string | null>(null)

  protected readonly href = computed(() => {
    const value = this.svgIcon()
    if (!value) return null
    const colon = value.indexOf(':')
    const namespace = colon > 0 ? value.slice(0, colon) : DEFAULT_NAMESPACE
    const id = colon >= 0 ? value.slice(colon + 1) : value
    const file = this.namespaces[namespace] ?? `${namespace.replaceAll('_', '-')}.svg`
    return `${this.path}${file}#${id}`
  })
}
