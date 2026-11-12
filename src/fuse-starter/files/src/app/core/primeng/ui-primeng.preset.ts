import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

/**
 * PrimeNG preset (Aura based) wired to the UI kit theme.
 *
 * - Primary: every shade reads the `--ui-primary-*` variables, so PrimeNG follows the active `theme-*`
 *   class live. The theming plugin also applies the body's theme to `:root`, where PrimeNG resolves
 *   its own variables.
 * - Surfaces: slate in both schemes. The dark tokens match the app's dark surfaces (cards and dialogs
 *   slate-800, fields slate-900, dividers slate-100 at 12%).
 *
 * Use it with `darkModeSelector: '.dark'`: `body.dark` (and `html.dark`) switch PrimeNG to dark.
 */

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

const primary = Object.fromEntries(SHADES.map((shade) => [shade, `var(--ui-primary-${shade})`]))

const slate = {
  0: '#ffffff',
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
}

const darkDivider = 'rgba(241, 245, 249, 0.12)'

/** Button primary colors from the semantic primary tokens, per state. */
function buttonPrimary(hoverColor: string, activeColor: string) {
  return {
    root: {
      primary: {
        background: '{primary.color}',
        hoverBackground: '{primary.hover.color}',
        activeBackground: '{primary.active.color}',
        borderColor: '{primary.color}',
        hoverBorderColor: '{primary.hover.color}',
        activeBorderColor: '{primary.active.color}',
        color: '{primary.contrast.color}',
        hoverColor,
        activeColor,
      },
    },
  }
}

export const UiPrimePreset = definePreset(Aura, {
  semantic: {
    primary,
    colorScheme: {
      light: {
        surface: slate,
        primary: {
          color: 'var(--ui-primary)',
          contrastColor: 'var(--ui-on-primary)',
          hoverColor: '{primary.700}',
          activeColor: '{primary.800}',
        },
      },
      dark: {
        surface: slate,
        primary: {
          color: '{primary.500}',
          contrastColor: 'var(--ui-on-primary-500)',
          hoverColor: '{primary.400}',
          activeColor: '{primary.300}',
        },
        formField: {
          background: '{surface.900}',
          disabledBackground: '{surface.800}',
          filledBackground: '{surface.800}',
          filledHoverBackground: '{surface.800}',
          filledFocusBackground: '{surface.800}',
          borderColor: '{surface.600}',
          hoverBorderColor: '{surface.500}',
        },
        content: {
          background: '{surface.800}',
          hoverBackground: '{surface.700}',
          borderColor: darkDivider,
        },
        overlay: {
          select: { background: '{surface.800}', borderColor: '{surface.700}' },
          popover: { background: '{surface.800}', borderColor: '{surface.700}' },
          modal: { background: '{surface.800}', borderColor: '{surface.700}' },
        },
        list: {
          option: { focusBackground: '{surface.700}' },
        },
        navigation: {
          item: { focusBackground: '{surface.700}', activeBackground: '{surface.700}' },
        },
      },
    },
  },
  components: {
    button: {
      colorScheme: {
        light: buttonPrimary('var(--ui-on-primary-700)', 'var(--ui-on-primary-800)'),
        dark: buttonPrimary('{primary.contrast.color}', '{primary.contrast.color}'),
      },
    },
    datatable: {
      colorScheme: {
        dark: {
          root: { borderColor: '{content.border.color}' },
          row: { stripedBackground: '{surface.900}' },
        },
      },
    },
  },
})
