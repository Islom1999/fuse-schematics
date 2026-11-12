import { HttpContext, HttpContextToken, HttpInterceptorFn } from '@angular/common/http'
import { inject, InjectionToken } from '@angular/core'
import { defer, finalize } from 'rxjs'
import { UiLoadingService } from './ui-loading.service'

/** Set to true on a request to keep it invisible to the loading bar. */
export const UI_LOADING_IGNORE = new HttpContextToken<boolean>(() => false)

/**
 * URLs the loading bar ignores. A string matches when the URL starts with it; a RegExp is tested
 * against the URL. Provided through `provideUi({ loading: { excludeUrls } })`.
 */
export const UI_LOADING_EXCLUDE = new InjectionToken<ReadonlyArray<string | RegExp>>('UI_LOADING_EXCLUDE')

/** Returns `context` (or a new context) with `UI_LOADING_IGNORE` set. */
export function uiNoLoadingBar(context: HttpContext = new HttpContext()): HttpContext {
  return context.set(UI_LOADING_IGNORE, true)
}

function isExcluded(url: string, rules: ReadonlyArray<string | RegExp>): boolean {
  return rules.some((rule) => {
    if (typeof rule === 'string') return rule.length > 0 && url.startsWith(rule)
    rule.lastIndex = 0
    return rule.test(url)
  })
}

/**
 * Counts every request for the loading bar while auto mode is on. Register it as the outermost
 * interceptor so that retried requests are counted once.
 */
export const uiLoadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(UiLoadingService)
  const exclude = inject(UI_LOADING_EXCLUDE, { optional: true }) ?? []

  return defer(() => {
    if (!loading.auto() || req.context.get(UI_LOADING_IGNORE) || isExcluded(req.url, exclude)) return next(req)
    const end = loading.beginRequest()
    return next(req).pipe(finalize(end))
  })
}
