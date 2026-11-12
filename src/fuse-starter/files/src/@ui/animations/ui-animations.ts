/**
 * Class names defined in `@ui/animations/animations.css`. Use them with Angular's
 * `animate.enter` / `animate.leave`, e.g. `animate.enter="ui-fade-in"`, or as conditional classes.
 */
export const UI_ANIMATIONS = {
  fadeIn: 'ui-fade-in',
  fadeOut: 'ui-fade-out',
  slideInTop: 'ui-slide-in-top',
  slideOutTop: 'ui-slide-out-top',
  fadeInLeft: 'ui-fade-in-left',
  fadeInRight: 'ui-fade-in-right',
  fadeOutLeft: 'ui-fade-out-left',
  fadeOutRight: 'ui-fade-out-right',
  expand: 'ui-expand',
  collapse: 'ui-collapse',
  shake: 'ui-shake',
} as const

export type UiAnimationClass = (typeof UI_ANIMATIONS)[keyof typeof UI_ANIMATIONS]

/** Timing tokens, also exposed as CSS custom properties on `:root`. */
export const UI_EASING = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  drawer: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
} as const

export const UI_DURATION = {
  entering: 225,
  exiting: 195,
  complex: 375,
} as const
