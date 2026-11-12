import { DOCUMENT, isPlatformBrowser } from '@angular/common'
import {
  computed,
  DestroyRef,
  effect,
  EffectRef,
  inject,
  Injectable,
  Injector,
  isDevMode,
  PLATFORM_ID,
  signal,
  untracked,
} from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { uiMediaQuerySignal } from '@ui/services/media-watcher/ui-media-query'
import {
  UI_CONFIG,
  UI_CONFIG_STORAGE_KEY,
  UI_LAYOUT_NAMES,
  UI_SCHEMES,
  UiConfig,
  UiConfigPatch,
  UiScheme,
} from './ui-config.types'

const STORAGE_VERSION = 1

/** The user-choosable fields, the only ones written to storage. */
type StoredFields = Partial<Pick<UiConfig, 'layout' | 'scheme' | 'theme'>>

/**
 * Single source of truth for the shell configuration (layout, scheme, theme, screens, themes).
 * The user's layout, scheme and theme survive reloads through `localStorage`.
 */
@Injectable({ providedIn: 'root' })
export class UiConfigService {
  private readonly document = inject(DOCUMENT)
  private readonly injector = inject(Injector)
  private readonly destroyRef = inject(DestroyRef)
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))
  private readonly defaults = inject(UI_CONFIG)
  private readonly storageKey = inject(UI_CONFIG_STORAGE_KEY)
  private readonly window = this.isBrowser ? this.document.defaultView : null
  private readonly state = signal<UiConfig>(this.initialConfig())
  private readonly prefersDark = uiMediaQuerySignal(this.window, '(prefers-color-scheme: dark)', this.destroyRef)
  private documentSync: EffectRef | null = null

  /** The whole config. Never mutate it; use `set()`. */
  readonly config = this.state.asReadonly()
  readonly layout = computed(() => this.state().layout)
  readonly scheme = computed(() => this.state().scheme)
  readonly theme = computed(() => this.state().theme)
  readonly screens = computed(() => this.state().screens)
  readonly themes = computed(() => this.state().themes)
  /** `scheme` with `auto` resolved through `prefers-color-scheme` (live). */
  readonly resolvedScheme = computed<'dark' | 'light'>(() => {
    const scheme = this.scheme()
    if (scheme !== 'auto') return scheme
    return this.prefersDark() ? 'dark' : 'light'
  })
  /** Compatibility stream of `config`. */
  readonly config$ = toObservable(this.config)

  constructor() {
    this.listenToOtherTabs()
  }

  /** Deep-merges `patch` into the config (arrays replaced, `undefined` ignored), then persists. */
  set(patch: UiConfigPatch): void {
    const current = untracked(this.state)
    const next = merge(current, patch) as UiConfig
    if (equal(next, current)) return
    this.state.set(this.freeze(next))
    if (next.layout !== current.layout || next.scheme !== current.scheme || next.theme !== current.theme) {
      this.write(next)
    }
  }

  /** Like `set()`, with a patch computed from the current config. */
  update(fn: (current: UiConfig) => UiConfigPatch): void {
    this.set(fn(untracked(this.state)))
  }

  /** Back to the `UI_CONFIG` defaults; the stored entry is removed. */
  reset(): void {
    this.state.set(this.freeze(clone(this.defaults)))
    this.withStorage((storage, key) => storage.removeItem(key))
  }

  /**
   * Keeps the document in sync, now and on every change: `body` gets exactly one of `light`/`dark`
   * and exactly one `theme-*` class; `html` gets `dark` when the scheme resolves to dark.
   * Idempotent. Called by `provideUi()` unless `applyToDocument` is false.
   */
  applyToDocument(): void {
    if (this.documentSync) return
    untracked(() => this.syncDocument(this.resolvedScheme(), this.theme()))
    this.documentSync = effect(() => this.syncDocument(this.resolvedScheme(), this.theme()), {
      injector: this.injector,
    })
  }

  private syncDocument(scheme: 'dark' | 'light', theme: string): void {
    const body = this.document.body
    if (!body) return
    const dark = scheme === 'dark'
    body.classList.toggle('dark', dark)
    body.classList.toggle('light', !dark)
    this.document.documentElement.classList.toggle('dark', dark)

    const stale = Array.from(body.classList).filter((name) => name.startsWith('theme-') && name !== theme)
    body.classList.remove(...stale)
    body.classList.add(theme)
  }

  private initialConfig(): UiConfig {
    const config = clone(this.defaults)
    const stored = this.withStorage((storage, key) => storage.getItem(key))
    return this.freeze({ ...config, ...this.parse(stored ?? null, config) })
  }

  /** Validated stored fields; anything unknown or malformed is dropped. */
  private parse(raw: string | null, base: UiConfig): StoredFields {
    if (!raw) return {}
    let data: unknown
    try {
      data = JSON.parse(raw)
    } catch {
      return {}
    }
    if (!isPlainObject(data) || data['v'] !== STORAGE_VERSION) return {}

    const fields: StoredFields = {}
    const { layout, scheme, theme } = data
    if (typeof layout === 'string' && (UI_LAYOUT_NAMES as readonly string[]).includes(layout)) fields.layout = layout
    if (typeof scheme === 'string' && UI_SCHEMES.includes(scheme as UiScheme)) fields.scheme = scheme as UiScheme
    if (typeof theme === 'string' && base.themes.some((option) => option.id === theme)) fields.theme = theme
    return fields
  }

  private write(config: UiConfig): void {
    const value = JSON.stringify({
      v: STORAGE_VERSION,
      layout: config.layout,
      scheme: config.scheme,
      theme: config.theme,
    })
    this.withStorage((storage, key) => storage.setItem(key, value))
  }

  private listenToOtherTabs(): void {
    const win = this.window
    if (!win || this.storageKey === null) return
    const listener = (event: StorageEvent) => {
      if (event.key !== this.storageKey) return
      const current = untracked(this.state)
      const base = clone(this.defaults)
      const next = { ...current, ...this.pick(base), ...this.parse(event.newValue, current) }
      if (!equal(next, current)) this.state.set(this.freeze(next))
    }
    win.addEventListener('storage', listener)
    this.destroyRef.onDestroy(() => win.removeEventListener('storage', listener))
  }

  private pick(config: UiConfig): StoredFields {
    return { layout: config.layout, scheme: config.scheme, theme: config.theme }
  }

  /** Runs `fn` against `localStorage`; `undefined` on the server, without a key, or when storage throws. */
  private withStorage<T>(fn: (storage: Storage, key: string) => T): T | undefined {
    if (!this.window || this.storageKey === null) return undefined
    try {
      return fn(this.window.localStorage, this.storageKey)
    } catch {
      return undefined
    }
  }

  private freeze(config: UiConfig): UiConfig {
    return isDevMode() ? deepFreeze(config) : config
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function clone<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clone) as T
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)])) as T
  }
  return value
}

/** New object: plain objects merged key by key (recursively), everything else replaced; `undefined` ignored. */
function merge(target: unknown, patch: unknown): unknown {
  if (!isPlainObject(patch)) return clone(patch)
  const result: Record<string, unknown> = isPlainObject(target) ? { ...target } : {}
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue
    result[key] = isPlainObject(value) && isPlainObject(result[key]) ? merge(result[key], value) : clone(value)
  }
  return result
}

function equal(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => equal(item, b[index]))
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Object.keys(a)
    return keys.length === Object.keys(b).length && keys.every((key) => key in b && equal(a[key], b[key]))
  }
  return false
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    Object.values(value).forEach(deepFreeze)
  }
  return value
}
