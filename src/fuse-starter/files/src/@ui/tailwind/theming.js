// @ts-check
const plugin = require('tailwindcss/plugin')
const { SHADES, generatePalette, contrastPalette, toTriplet } = require('./color')

/**
 * @typedef {string | Record<string, string>} UiPaletteInput
 *   A single color (shades 50–900 are generated from it) or a palette with any of the keys 50…950
 *   and `DEFAULT`. A palette without `DEFAULT` uses its 500 shade.
 *
 * @typedef {object} UiThemeInput
 * @property {UiPaletteInput} [primary]
 * @property {UiPaletteInput} [accent]
 * @property {UiPaletteInput} [warn]
 * @property {Record<string, string>} [on-primary] explicit contrast colors, by key
 * @property {Record<string, string>} [on-accent]
 * @property {Record<string, string>} [on-warn]
 *
 * @typedef {object} UiThemingOptions
 * @property {Record<string, UiThemeInput>} themes keyed by theme id without the `theme-` prefix.
 *   `default` must define primary, accent and warn; the other themes inherit what they omit.
 * @property {{ light?: Record<string, string>, dark?: Record<string, string> }} [schemes]
 *   overrides of the scheme tokens below
 */

/** Theme palettes exposed as CSS variables and Tailwind colors. */
const PALETTES = ['primary', 'accent', 'warn']

/** Scheme tokens (`--ui-<name>`); the `bg-*`/`text-*` utilities read them. */
const SCHEMES = {
  light: {
    'bg-app-bar': '#ffffff',
    'bg-card': '#ffffff',
    'bg-default': '#f1f5f9',
    'bg-dialog': '#ffffff',
    'bg-hover': 'rgba(148, 163, 184, 0.12)',
    'bg-status-bar': '#cbd5e1',
    'text-default': '#1e293b',
    'text-secondary': '#64748b',
    'text-hint': '#94a3b8',
    'text-disabled': '#94a3b8',
    border: '#e2e8f0',
    divider: '#e2e8f0',
    icon: '#64748b',
  },
  dark: {
    'bg-app-bar': '#0f172a',
    'bg-card': '#1e293b',
    'bg-default': '#0f172a',
    'bg-dialog': '#1e293b',
    'bg-hover': 'rgba(255, 255, 255, 0.05)',
    'bg-status-bar': '#0f172a',
    'text-default': '#ffffff',
    'text-secondary': '#94a3b8',
    'text-hint': '#64748b',
    'text-disabled': '#475569',
    border: 'rgba(241, 245, 249, 0.12)',
    divider: 'rgba(241, 245, 249, 0.12)',
    icon: '#94a3b8',
  },
}

/**
 * @param {UiPaletteInput} input
 * @returns {Record<string, string>} shades plus DEFAULT
 */
function normalizePalette(input) {
  const source = typeof input === 'string' ? generatePalette(input) : input
  /** @type {Record<string, string>} */
  const palette = {}
  for (const shade of SHADES) if (source[shade]) palette[shade] = source[shade]
  palette.DEFAULT = source.DEFAULT ?? palette['500']
  if (!palette.DEFAULT) throw new Error('[ui] A theme palette needs a DEFAULT or a 500 shade.')
  return palette
}

/**
 * Declarations for one palette and its contrast palette.
 * @param {string} name
 * @param {Record<string, string>} palette
 * @param {Record<string, string>} [overrides]
 */
function paletteVariables(name, palette, overrides = {}) {
  const on = { ...contrastPalette(palette), ...overrides }
  /** @type {Record<string, string>} */
  const vars = {}
  /** @param {string} prefix @param {Record<string, string>} colors */
  const put = (prefix, colors) => {
    for (const [key, color] of Object.entries(colors)) {
      const variable = key === 'DEFAULT' ? `--ui-${prefix}` : `--ui-${prefix}-${key}`
      vars[variable] = color
      vars[`${variable}-rgb`] = toTriplet(color)
    }
  }
  put(name, palette)
  put(`on-${name}`, on)
  return vars
}

/**
 * @param {Record<string, string>} tokens
 */
function schemeVariables(tokens) {
  /** @type {Record<string, string>} */
  const vars = {}
  for (const [name, color] of Object.entries(tokens)) {
    vars[`--ui-${name}`] = color
    vars[`--ui-${name}-rgb`] = toTriplet(color)
  }
  return vars
}

/**
 * Tailwind colors that read the theme variables, with opacity support (`bg-primary/10`).
 * @returns {Record<string, Record<string, string>>}
 */
function themeColors() {
  /** @type {Record<string, Record<string, string>>} */
  const colors = {}
  for (const name of PALETTES) {
    for (const prefix of [name, `on-${name}`]) {
      /** @type {Record<string, string>} */
      const scale = { DEFAULT: `rgb(var(--ui-${prefix}-rgb) / <alpha-value>)` }
      for (const shade of SHADES) scale[shade] = `rgb(var(--ui-${prefix}-${shade}-rgb) / <alpha-value>)`
      colors[prefix] = scale
    }
  }
  return colors
}

/**
 * Emits the theme variables (per `theme-*` scope) and the scheme variables (per `.light`/`.dark` scope),
 * and adds the `primary`, `accent`, `warn` and `on-*` colors to Tailwind.
 *
 * The default theme applies to `:root` and to `.theme-default`. Every other theme applies to `.theme-<id>`
 * (nestable) and to `:root` while `<body>` carries its class, so variables resolved on `:root` (PrimeNG's)
 * follow the active theme too.
 */
const uiTheming = plugin.withOptions(
  /** @param {UiThemingOptions} options */
  (options) =>
    ({ addBase }) => {
      const themes = options?.themes ?? {}
      if (!themes.default) throw new Error('[ui] uiTheming() needs a "default" theme.')

      for (const [id, theme] of Object.entries(themes)) {
        /** @type {Record<string, string>} */
        let vars = {}
        for (const name of PALETTES) {
          const input = theme[/** @type {'primary' | 'accent' | 'warn'} */ (name)]
          if (input === undefined) {
            if (id === 'default') throw new Error(`[ui] The default theme needs a "${name}" palette.`)
            continue
          }
          const overrides = theme[/** @type {'on-primary' | 'on-accent' | 'on-warn'} */ (`on-${name}`)]
          vars = { ...vars, ...paletteVariables(name, normalizePalette(input), overrides) }
        }
        if (id === 'default') {
          addBase({ ':root, .theme-default': vars })
        } else {
          // Two rules: a browser without :has() must still apply the class rule.
          addBase({ [`.theme-${id}`]: vars })
          addBase({ [`:root:has(> body.theme-${id})`]: vars })
        }
      }

      const light = { ...SCHEMES.light, ...options?.schemes?.light }
      const dark = { ...SCHEMES.dark, ...options?.schemes?.dark }
      addBase({ ':root, .light': schemeVariables(light) })
      addBase({ '.dark': schemeVariables(dark) })
    },
  () => ({ theme: { extend: { colors: themeColors() } } }),
)

module.exports = { uiTheming, normalizePalette, themeColors, SCHEMES }
