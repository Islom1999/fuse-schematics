// @ts-check
const colors = require('tailwindcss/colors')
const defaultTheme = require('tailwindcss/defaultTheme')
const typography = require('@tailwindcss/typography')
const { uiTheming, uiUtilities } = require('./src/@ui/tailwind')

/**
 * Theme palettes. Each becomes a body class `theme-<key>` (see `themes` in the app config).
 * Only `default` defines accent and warn; the other themes inherit them.
 */
const themes = {
  default: {
    primary: { ...colors.indigo, DEFAULT: colors.indigo[600] },
    accent: { ...colors.slate, DEFAULT: colors.slate[800] },
    warn: { ...colors.red, DEFAULT: colors.red[600] },
    'on-warn': { 500: colors.red[50] },
  },
  // Generated from a single color.
  brand: { primary: '#2196F3' },
  teal: { primary: { ...colors.teal, DEFAULT: colors.teal[600] } },
  rose: { primary: colors.rose },
  purple: { primary: { ...colors.purple, DEFAULT: colors.purple[600] } },
  amber: { primary: colors.amber },
}

const extraSpacing = {
  13: '3.25rem',
  15: '3.75rem',
  18: '4.5rem',
  22: '5.5rem',
  26: '6.5rem',
  30: '7.5rem',
  50: '12.5rem',
  90: '22.5rem',
  100: '25rem',
  120: '30rem',
  128: '32rem',
  140: '35rem',
  160: '40rem',
  180: '45rem',
  192: '48rem',
  200: '50rem',
  240: '60rem',
  256: '64rem',
  280: '70rem',
  320: '80rem',
  360: '90rem',
  400: '100rem',
  480: '120rem',
  '1/2': '50%',
  '1/3': '33.333333%',
  '2/3': '66.666667%',
  '1/4': '25%',
  '2/4': '50%',
  '3/4': '75%',
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,scss,css,ts}'],
  // Badge colors come from navigation data, not from templates.
  safelist: [
    'text-white',
    'text-on-primary',
    'bg-primary',
    {
      pattern:
        /^bg-(primary|accent|warn|slate|gray|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(500|600)$/,
    },
  ],
  important: true,
  darkMode: 'class',
  theme: {
    screens: {
      sm: '600px',
      md: '960px',
      lg: '1280px',
      xl: '1440px',
    },
    // Size only: line-height comes from the inherited 1.5.
    fontSize: {
      xs: '0.625rem',
      sm: '0.75rem',
      md: '0.8125rem',
      base: '0.875rem',
      lg: '1rem',
      xl: '1.125rem',
      '2xl': '1.25rem',
      '3xl': '1.5rem',
      '4xl': '2rem',
      '5xl': '2.25rem',
      '6xl': '2.5rem',
      '7xl': '3rem',
      '8xl': '4rem',
      '9xl': '6rem',
      '10xl': '8rem',
    },
    extend: {
      colors: {
        gray: colors.slate,
      },
      borderColor: {
        DEFAULT: 'var(--ui-border)',
      },
      fontFamily: {
        sans: ['"Inter var"', ...defaultTheme.fontFamily.sans],
      },
      spacing: extraSpacing,
      minWidth: ({ theme }) => ({ ...theme('spacing'), screen: '100vw' }),
      maxWidth: ({ theme }) => ({ ...theme('spacing'), screen: '100vw' }),
      minHeight: ({ theme }) => ({ ...theme('spacing') }),
      flex: { 0: '0 0 auto' },
      opacity: { 12: '0.12', 38: '0.38', 87: '0.87' },
      zIndex: {
        '-1': '-1',
        49: '49',
        60: '60',
        70: '70',
        80: '80',
        90: '90',
        99: '99',
        999: '999',
        9999: '9999',
        99999: '99999',
      },
      rotate: { '-270': '270deg', 15: '15deg', 30: '30deg', 60: '60deg', 270: '270deg' },
      scale: { 1: '1' },
      transitionDuration: { 400: '400ms' },
      transitionTimingFunction: { drawer: 'cubic-bezier(0.25, 0.8, 0.25, 1)' },
      animation: { 'spin-slow': 'spin 3s linear infinite' },
      typography: () => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': 'var(--ui-text-default)',
            '--tw-prose-headings': 'var(--ui-text-default)',
            '--tw-prose-lead': 'var(--ui-text-secondary)',
            '--tw-prose-links': 'rgb(var(--ui-primary-500-rgb))',
            '--tw-prose-bold': 'var(--ui-text-default)',
            '--tw-prose-counters': 'var(--ui-text-secondary)',
            '--tw-prose-bullets': 'var(--ui-text-hint)',
            '--tw-prose-hr': 'var(--ui-border)',
            '--tw-prose-quotes': 'var(--ui-text-default)',
            '--tw-prose-quote-borders': 'var(--ui-border)',
            '--tw-prose-captions': 'var(--ui-text-secondary)',
            '--tw-prose-code': 'var(--ui-text-default)',
            '--tw-prose-pre-code': colors.white,
            '--tw-prose-pre-bg': colors.slate[800],
            '--tw-prose-th-borders': 'var(--ui-border)',
            '--tw-prose-td-borders': 'var(--ui-border)',
            'a code': { color: 'var(--ui-primary)' },
            code: { fontWeight: '500' },
            'ol[type="A"]': null,
            'ol[type="a"]': null,
            'ol[type="A" s]': null,
            'ol[type="a" s]': null,
            'ol[type="I"]': null,
            'ol[type="i"]': null,
            'ol[type="I" s]': null,
            'ol[type="i" s]': null,
            'ol[type="1"]': null,
          },
        },
        sm: {
          css: {
            code: { fontSize: '1em' },
            pre: { fontSize: '1em' },
            table: { fontSize: '1em' },
          },
        },
      }),
    },
  },
  corePlugins: {
    appearance: false,
    container: false,
    float: false,
    clear: false,
    placeholderOpacity: false,
    verticalAlign: false,
  },
  plugins: [uiTheming({ themes }), uiUtilities, typography],
}
