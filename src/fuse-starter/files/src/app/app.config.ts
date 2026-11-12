import { provideHttpClient, withInterceptors } from '@angular/common/http'
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core'
import {
  PreloadAllModules,
  provideRouter,
  withInMemoryScrolling,
  withPreloading,
} from '@angular/router'
import { provideUi, uiLoadingInterceptor } from '@ui'
import { provideTransloco, TranslocoService } from '@jsverse/transloco'
import { firstValueFrom } from 'rxjs'
import { appRoutes } from 'app/app.routes'
import { authInterceptor } from 'app/core/auth/auth.interceptor'
import { devMockInterceptor } from 'app/core/dev-mock/dev-mock.interceptor'
import { errorInterceptor } from 'app/core/http/error.interceptor'
import { MessageService } from 'primeng/api'
import { LANGUAGE_STORAGE_KEY } from 'app/layout/common/languages/languages.component'
import { TranslocoHttpLoader } from './core/transloco/transloco.http-loader'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { providePrimeNG } from 'primeng/config'
import { UiPrimePreset } from './core/primeng/ui-primeng.preset'
import { provideFormlyCore, FORMLY_CONFIG } from '@ngx-formly/core'
import { withFormlyPrimeNG } from '@ngx-formly/primeng'
import { registerTranslateExtension } from './shared/ngx-formly/translate.extension'
import { TypeAutocomplete } from './shared/ngx-formly/type-autocomplete'
import { TypeDatepicker } from './shared/ngx-formly/type-datepicker'
import { TypeInputMask } from './shared/ngx-formly/type-input-mask'
import { TypeInputNumber } from './shared/ngx-formly/type-input-number'
import { TypeJson } from './shared/ngx-formly/type-json'
import { TypeMultiSelect } from './shared/ngx-formly/type-multiselect'
import { TypeRelationSelect } from './shared/ngx-formly/type-relation-select'
import { TypeTextArea } from './shared/ngx-formly/type-textarea'
import { TypeUpload } from './shared/ngx-formly/type-upload.component'
import { environment } from 'environments/environment.development'
import { DITokens } from './core/utils/di-tokens'

export const appConfig: ApplicationConfig = {
  providers: [
    // Zoneless change detection (zone.js is not loaded). Change detection runs on
    // signal updates, template/host event listeners, async pipe and markForCheck().
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),

    // Order matters: the loading bar counts a request once, errors are toasted after the auth
    // retry, and the dev-mock answers innermost, like the real backend would.
    provideHttpClient(
      withInterceptors([uiLoadingInterceptor, errorInterceptor, authInterceptor, devMockInterceptor]),
    ),
    provideRouter(
      appRoutes,
      withPreloading(PreloadAllModules),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),

    {
      provide: DITokens.API_BASE_URL,
      useValue: environment.apiUrl,
    },

    MessageService,
    provideAnimationsAsync(),
    providePrimeNG({
      ripple: true,
      theme: {
        preset: UiPrimePreset,
        options: {
          prefix: 'p',
          darkModeSelector: '.dark',
          cssLayer: false, // Disable CSS layers for now
        },
      },
    }),

    // Formly Config
    provideFormlyCore([
      ...withFormlyPrimeNG(),
      {
        types: [
          {
            name: 'textarea',
            component: TypeTextArea,
            wrappers: ['form-field'],
          },
          {
            name: 'input-number',
            component: TypeInputNumber,
            wrappers: ['form-field'],
          },
          {
            name: 'input-mask',
            component: TypeInputMask,
            wrappers: ['form-field'],
          },
          {
            name: 'datepicker',
            component: TypeDatepicker,
            wrappers: ['form-field'],
          },
          {
            name: 'autocomplete',
            component: TypeAutocomplete,
            wrappers: ['form-field'],
          },
          {
            name: 'multiselect',
            component: TypeMultiSelect,
            wrappers: ['form-field'],
          },
          {
            name: 'json',
            component: TypeJson,
            wrappers: ['form-field'],
          },
          {
            name: 'relation-select',
            component: TypeRelationSelect,
            wrappers: ['form-field'],
          },
          {
            name: 'upload',
            component: TypeUpload,
            wrappers: ['form-field'],
          },
        ],
      },
    ]),
    {
      provide: FORMLY_CONFIG,
      multi: true,
      useFactory: registerTranslateExtension,
      deps: [TranslocoService],
    },

    // Transloco Config
    provideTransloco({
      config: {
        availableLangs: [
          {
            id: 'en',
            label: 'English',
          },
          {
            id: 'tr',
            label: 'Turkish',
          },
        ],
        defaultLang: 'en',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: true,
      },
      loader: TranslocoHttpLoader,
    }),
    // Restore the language chosen in the languages menu, else use the default one.
    provideAppInitializer(() => {
      const transloco = inject(TranslocoService)
      let lang = transloco.getDefaultLang()
      try {
        const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
        if (stored && transloco.isLang(stored)) lang = stored
      } catch {
        // storage unavailable
      }
      transloco.setActiveLang(lang)
      return firstValueFrom(transloco.load(lang))
    }),

    provideUi({
      config: {
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
      },
    }),
  ],
}
