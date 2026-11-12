export type UiAlertAppearance = 'border' | 'fill' | 'outline' | 'soft'
export type UiAlertType = 'primary' | 'accent' | 'warn' | 'basic' | 'info' | 'success' | 'warning' | 'error'

/** Tailwind classes for each part of one alert (type + appearance). */
export interface UiAlertTone {
  box: string
  icon: string
  title: string
  message: string
  close: string
  stripe: string
}

interface UiAlertPalette {
  soft: Omit<UiAlertTone, 'stripe'>
  ring: string
  fill: Omit<UiAlertTone, 'stripe'>
  border: UiAlertTone
}

// Class names are spelled out in full so that Tailwind finds them when scanning this file.
const BORDER_BOX = 'bg-card shadow-md dark:bg-gray-700'
const BORDER_MESSAGE =
  'text-gray-600 dark:text-gray-300 [&_code]:bg-gray-200 [&_code]:text-gray-800 dark:[&_code]:bg-gray-400'
const BORDER_CLOSE = 'text-gray-600 dark:text-gray-300'
const ON_FILL = 'text-white'

const PALETTES: Record<UiAlertType, UiAlertPalette> = {
  primary: {
    soft: {
      box: 'bg-primary-50 dark:bg-primary-600',
      icon: 'text-primary-600 dark:text-white',
      title: 'text-primary-900 dark:text-white',
      message: 'text-primary-700 dark:text-primary-200 [&_code]:bg-primary-200 [&_code]:text-primary-800',
      close: 'text-primary-900 dark:text-white',
    },
    ring: 'ring-primary-400',
    fill: {
      box: 'bg-primary-600',
      icon: ON_FILL,
      title: ON_FILL,
      message: 'text-primary-100 [&_code]:bg-primary-200 [&_code]:text-primary-800',
      close: ON_FILL,
    },
    border: {
      box: BORDER_BOX,
      stripe: 'bg-primary dark:bg-primary-400',
      icon: 'text-primary dark:text-primary-400',
      title: 'text-primary dark:text-primary-400',
      message: BORDER_MESSAGE,
      close: BORDER_CLOSE,
    },
  },
  accent: {
    soft: {
      box: 'bg-accent-50 dark:bg-accent-600',
      icon: 'text-accent-600 dark:text-white',
      title: 'text-accent-900 dark:text-white',
      message: 'text-accent-700 dark:text-accent-200 [&_code]:bg-accent-200 [&_code]:text-accent-800',
      close: 'text-accent-900 dark:text-white',
    },
    ring: 'ring-accent-400',
    fill: {
      box: 'bg-accent-600',
      icon: ON_FILL,
      title: ON_FILL,
      message: 'text-accent-100 [&_code]:bg-accent-200 [&_code]:text-accent-800',
      close: ON_FILL,
    },
    border: {
      box: BORDER_BOX,
      stripe: 'bg-accent dark:bg-accent-400',
      icon: 'text-accent dark:text-accent-400',
      title: 'text-accent dark:text-accent-400',
      message: BORDER_MESSAGE,
      close: BORDER_CLOSE,
    },
  },
  warn: {
    soft: {
      box: 'bg-warn-50 dark:bg-warn-600',
      icon: 'text-warn-600 dark:text-white',
      title: 'text-warn-900 dark:text-white',
      message: 'text-warn-700 dark:text-warn-200 [&_code]:bg-warn-200 [&_code]:text-warn-800',
      close: 'text-warn-900 dark:text-white',
    },
    ring: 'ring-warn-400',
    fill: {
      box: 'bg-warn-600',
      icon: ON_FILL,
      title: ON_FILL,
      message: 'text-warn-100 [&_code]:bg-warn-200 [&_code]:text-warn-800',
      close: ON_FILL,
    },
    border: {
      box: BORDER_BOX,
      stripe: 'bg-warn dark:bg-warn-400',
      icon: 'text-warn dark:text-warn-400',
      title: 'text-warn dark:text-warn-400',
      message: BORDER_MESSAGE,
      close: BORDER_CLOSE,
    },
  },
  basic: {
    soft: {
      box: 'bg-gray-100 dark:bg-gray-600',
      icon: 'text-gray-600 dark:text-white',
      title: 'text-gray-900 dark:text-white',
      message: 'text-gray-700 dark:text-gray-200 [&_code]:bg-gray-200 [&_code]:text-gray-800',
      close: 'text-gray-900 dark:text-white',
    },
    ring: 'ring-gray-400',
    fill: {
      box: 'bg-gray-600',
      icon: ON_FILL,
      title: ON_FILL,
      message: 'text-gray-100 [&_code]:bg-gray-200 [&_code]:text-gray-800',
      close: ON_FILL,
    },
    border: {
      box: BORDER_BOX,
      stripe: 'bg-gray-600 dark:bg-gray-400',
      icon: 'text-gray-600 dark:text-gray-400',
      title: 'text-gray-600 dark:text-gray-400',
      message: BORDER_MESSAGE,
      close: BORDER_CLOSE,
    },
  },
  info: {
    soft: {
      box: 'bg-blue-50 dark:bg-blue-600',
      icon: 'text-blue-600 dark:text-white',
      title: 'text-blue-900 dark:text-white',
      message: 'text-blue-700 dark:text-blue-200 [&_code]:bg-blue-200 [&_code]:text-blue-800',
      close: 'text-blue-900 dark:text-white',
    },
    ring: 'ring-blue-400',
    fill: {
      box: 'bg-blue-600',
      icon: ON_FILL,
      title: ON_FILL,
      message: 'text-blue-100 [&_code]:bg-blue-200 [&_code]:text-blue-800',
      close: ON_FILL,
    },
    border: {
      box: BORDER_BOX,
      stripe: 'bg-blue-600 dark:bg-blue-400',
      icon: 'text-blue-700 dark:text-blue-400',
      title: 'text-blue-700 dark:text-blue-400',
      message: BORDER_MESSAGE,
      close: BORDER_CLOSE,
    },
  },
  success: {
    soft: {
      box: 'bg-green-50 dark:bg-green-600',
      icon: 'text-green-600 dark:text-white',
      title: 'text-green-900 dark:text-white',
      message: 'text-green-700 dark:text-green-200 [&_code]:bg-green-200 [&_code]:text-green-800',
      close: 'text-green-900 dark:text-white',
    },
    ring: 'ring-green-400',
    fill: {
      box: 'bg-green-600',
      icon: ON_FILL,
      title: ON_FILL,
      message: 'text-green-100 [&_code]:bg-green-200 [&_code]:text-gray-800',
      close: ON_FILL,
    },
    border: {
      box: BORDER_BOX,
      stripe: 'bg-green-500 dark:bg-green-400',
      icon: 'text-green-500 dark:text-green-400',
      title: 'text-green-500 dark:text-green-400',
      message: BORDER_MESSAGE,
      close: BORDER_CLOSE,
    },
  },
  warning: {
    soft: {
      box: 'bg-amber-50 dark:bg-amber-600',
      icon: 'text-amber-600 dark:text-white',
      title: 'text-amber-900 dark:text-white',
      message: 'text-amber-700 dark:text-amber-200 [&_code]:bg-amber-200 [&_code]:text-amber-800',
      close: 'text-amber-900 dark:text-white',
    },
    ring: 'ring-amber-400',
    fill: {
      box: 'bg-amber-500',
      icon: ON_FILL,
      title: ON_FILL,
      message: 'text-amber-100 [&_code]:bg-amber-200 [&_code]:text-amber-800',
      close: ON_FILL,
    },
    border: {
      box: BORDER_BOX,
      stripe: 'bg-amber-500 dark:bg-amber-400',
      icon: 'text-amber-500 dark:text-amber-400',
      title: 'text-amber-500 dark:text-amber-400',
      message: BORDER_MESSAGE,
      close: BORDER_CLOSE,
    },
  },
  error: {
    soft: {
      box: 'bg-red-50 dark:bg-red-600',
      icon: 'text-red-600 dark:text-white',
      title: 'text-red-900 dark:text-white',
      message: 'text-red-700 dark:text-red-200 [&_code]:bg-red-200 [&_code]:text-red-800',
      close: 'text-red-900 dark:text-white',
    },
    ring: 'ring-red-400',
    fill: {
      box: 'bg-red-600',
      icon: ON_FILL,
      title: ON_FILL,
      message: 'text-red-100 [&_code]:bg-red-200 [&_code]:text-red-800',
      close: ON_FILL,
    },
    border: {
      box: BORDER_BOX,
      stripe: 'bg-red-600 dark:bg-red-400',
      icon: 'text-red-700 dark:text-red-400',
      title: 'text-red-700 dark:text-red-400',
      message: BORDER_MESSAGE,
      close: BORDER_CLOSE,
    },
  },
}

/** Resolves the Tailwind classes for a type and appearance. */
export function uiAlertTone(type: UiAlertType, appearance: UiAlertAppearance): UiAlertTone {
  const palette = PALETTES[type] ?? PALETTES.primary
  switch (appearance) {
    case 'fill':
      return { ...palette.fill, stripe: '' }
    case 'border':
      return palette.border
    case 'outline':
      return { ...palette.soft, box: `${palette.soft.box} ring-1 ring-inset ${palette.ring}`, stripe: '' }
    default:
      return { ...palette.soft, stripe: '' }
  }
}

/** Default PrimeIcons glyph per type. */
export const UI_ALERT_ICONS: Record<UiAlertType, string> = {
  primary: 'pi pi-check-circle',
  accent: 'pi pi-check-circle',
  success: 'pi pi-check-circle',
  warn: 'pi pi-times-circle',
  error: 'pi pi-times-circle',
  basic: 'pi pi-circle',
  info: 'pi pi-info-circle',
  warning: 'pi pi-exclamation-triangle',
}
