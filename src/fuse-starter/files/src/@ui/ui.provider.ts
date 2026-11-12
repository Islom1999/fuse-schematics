import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  Provider,
} from '@angular/core'
import { ConfirmationService } from 'primeng/api'
import { UI_ICON_NAMESPACES, UI_ICONS_PATH } from './components/icon/ui-icon.component'
import { UI_LOADING_EXCLUDE, UiLoadingService } from './components/loading-bar'
import { UI_CONFIG, UI_CONFIG_STORAGE_KEY, uiAssertConfig, UiConfig, UiConfigService } from './services/config'
import { UiMediaWatcherService } from './services/media-watcher'
import { UiPlatformService } from './services/platform'
import { UiSplashScreenService } from './services/splash-screen'

export interface UiProviderConfig {
  /** Defaults for `UiConfigService`. */
  config: UiConfig
  /** `localStorage` key for the user's choices. Default `'ui-config'`; `null` disables persistence. */
  configStorageKey?: string | null
  /** Sync the scheme, theme and OS classes onto the document. Default `true`. */
  applyToDocument?: boolean
  loading?: { auto?: boolean; excludeUrls?: ReadonlyArray<string | RegExp> }
  icons?: { path?: string; namespaces?: Record<string, string> }
  /** Hide the splash screen after the first navigation. Default `true`. */
  splashScreen?: boolean
}

/**
 * Registers the UI kit. The loading interceptor is not added here: put `uiLoadingInterceptor`
 * first in the app's `withInterceptors([...])` list.
 */
export function provideUi(options: UiProviderConfig): EnvironmentProviders {
  const providers: Provider[] = [
    { provide: UI_CONFIG, useValue: uiAssertConfig(options.config) },
    { provide: UI_LOADING_EXCLUDE, useValue: options.loading?.excludeUrls ?? [] },
    ConfirmationService,
  ]
  if (options.configStorageKey !== undefined) {
    providers.push({ provide: UI_CONFIG_STORAGE_KEY, useValue: options.configStorageKey })
  }
  if (options.icons?.path) providers.push({ provide: UI_ICONS_PATH, useValue: options.icons.path })
  if (options.icons?.namespaces) providers.push({ provide: UI_ICON_NAMESPACES, useValue: options.icons.namespaces })

  return makeEnvironmentProviders([
    providers,
    provideEnvironmentInitializer(() => {
      const applyToDocument = options.applyToDocument !== false
      const config = inject(UiConfigService)
      const platform = inject(UiPlatformService)
      if (applyToDocument) {
        config.applyToDocument()
        platform.applyToDocument()
      }
      inject(UiMediaWatcherService)
      if (options.splashScreen !== false) inject(UiSplashScreenService)
      inject(UiLoadingService).setAutoMode(options.loading?.auto ?? true)
    }),
  ])
}
