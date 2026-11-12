import { InjectionToken } from '@angular/core'

export type UiScheme = 'auto' | 'dark' | 'light'

/** Breakpoint alias -> min-width CSS length, in ascending order. */
export type UiScreens = Record<string, string>

export type UiTheme = 'theme-default' | (string & {})

export interface UiThemeOption {
  id: string
  name: string
}

export type UiLayoutName =
  | 'empty'
  | 'classic'
  | 'classy'
  | 'compact'
  | 'dense'
  | 'futuristic'
  | 'thin'
  | 'centered'
  | 'enterprise'
  | 'material'
  | 'modern'

export interface UiConfig {
  layout: UiLayoutName | (string & {})
  scheme: UiScheme
  screens: UiScreens
  theme: UiTheme
  themes: UiThemeOption[]
}

/** A partial config. Plain nested objects (`screens`) may be partial too; arrays are replaced whole. */
export interface UiConfigPatch {
  layout?: UiConfig['layout']
  scheme?: UiScheme
  screens?: Partial<UiScreens>
  theme?: UiTheme
  themes?: UiThemeOption[]
}

export const UI_SCHEMES: readonly UiScheme[] = ['auto', 'dark', 'light']

export const UI_LAYOUT_NAMES: readonly UiLayoutName[] = [
  'empty',
  'classic',
  'classy',
  'compact',
  'dense',
  'futuristic',
  'thin',
  'centered',
  'enterprise',
  'material',
  'modern',
]

/** The starter defaults (classy, light, default theme). */
export const UI_DEFAULT_CONFIG: UiConfig = {
  layout: 'classy',
  scheme: 'light',
  screens: { sm: '600px', md: '960px', lg: '1280px', xl: '1440px' },
  theme: 'theme-default',
  themes: [
    { id: 'theme-default', name: 'Default' },
    { id: 'theme-brand', name: 'Brand' },
    { id: 'theme-teal', name: 'Teal' },
    { id: 'theme-rose', name: 'Rose' },
    { id: 'theme-purple', name: 'Purple' },
    { id: 'theme-amber', name: 'Amber' },
  ],
}

/** Config defaults, normally provided by `provideUi({ config })`. */
export const UI_CONFIG = new InjectionToken<UiConfig>('UI_CONFIG', { factory: () => UI_DEFAULT_CONFIG })

/** `localStorage` key for the user's choices; `null` disables persistence. */
export const UI_CONFIG_STORAGE_KEY = new InjectionToken<string | null>('UI_CONFIG_STORAGE_KEY', {
  factory: () => 'ui-config',
})

/** Throws when the scheme is unknown or `theme` is not one of `themes`. Returns the config unchanged. */
export function uiAssertConfig(config: UiConfig): UiConfig {
  if (!UI_SCHEMES.includes(config.scheme)) {
    throw new Error(`[ui] Invalid config scheme "${config.scheme}". Use one of: ${UI_SCHEMES.join(', ')}.`)
  }
  if (!config.themes.some((theme) => theme.id === config.theme)) {
    throw new Error(`[ui] Config theme "${config.theme}" is not listed in config.themes.`)
  }
  return config
}
