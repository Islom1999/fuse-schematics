import { IsActiveMatchOptions } from '@angular/router'

/** Same path and same query params; fragment and matrix params ignored. */
export const UI_EXACT_MATCH_OPTIONS: IsActiveMatchOptions = {
  paths: 'exact',
  queryParams: 'exact',
  fragment: 'ignored',
  matrixParams: 'ignored',
}

/** URL contains the link's path and its query params as a subset; fragment and matrix params ignored. */
export const UI_SUBSET_MATCH_OPTIONS: IsActiveMatchOptions = {
  paths: 'subset',
  queryParams: 'subset',
  fragment: 'ignored',
  matrixParams: 'ignored',
}

export function uiMatchOptions(exact: boolean | undefined): IsActiveMatchOptions {
  return exact ? UI_EXACT_MATCH_OPTIONS : UI_SUBSET_MATCH_OPTIONS
}

const ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

/** Random `[A-Za-z0-9]` string, used for default component names. */
export function uiRandomId(length = 10): string {
  const bytes = new Uint8Array(length)
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes)
  else for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256)
  return Array.from(bytes, (b) => ALPHANUMERIC[b % ALPHANUMERIC.length]).join('')
}

/**
 * Scrolls `container` so that `target` starts `offsetTop` px below its top edge.
 * With `onlyIfHidden`, a target that is already fully visible is left alone.
 */
export function uiScrollIntoView(
  container: HTMLElement,
  target: Element | string,
  opts: { offsetTop?: number; onlyIfHidden?: boolean; behavior?: ScrollBehavior } = {},
): void {
  const element = typeof target === 'string' ? container.querySelector(target) : target
  if (!element) return

  const box = container.getBoundingClientRect()
  const rect = element.getBoundingClientRect()
  if (opts.onlyIfHidden && rect.top >= box.top && rect.bottom <= box.bottom) return

  const top = container.scrollTop + (rect.top - box.top) - (opts.offsetTop ?? 0)
  container.scrollTo({ top, behavior: opts.behavior ?? 'auto' })
}
