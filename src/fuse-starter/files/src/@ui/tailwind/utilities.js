// @ts-check
const plugin = require('tailwindcss/plugin')

/**
 * Scheme-aware utilities (`bg-card`, `text-secondary`, `ring-bg-card`, …). Each reads the `--ui-*` scheme
 * variable of the nearest `.light`/`.dark` scope, so it follows the scheme at runtime, and works with every
 * variant (`dark:`, `hover:`, `sm:`, …) and with `@apply`.
 */
const uiUtilities = plugin(({ addUtilities }) => {
  /** @type {Record<string, Record<string, string>>} */
  const utilities = {}
  for (const name of ['bg-app-bar', 'bg-card', 'bg-default', 'bg-dialog', 'bg-hover', 'bg-status-bar']) {
    utilities[`.${name}`] = { 'background-color': `var(--ui-${name})` }
  }
  for (const name of ['text-default', 'text-secondary', 'text-hint', 'text-disabled']) {
    utilities[`.${name}`] = { color: `var(--ui-${name})` }
  }
  utilities['.divider'] = { color: 'var(--ui-divider)' }
  for (const name of ['bg-card', 'bg-default']) {
    utilities[`.ring-${name}`] = { '--tw-ring-color': `var(--ui-${name})` }
  }
  addUtilities(utilities)
})

module.exports = { uiUtilities }
