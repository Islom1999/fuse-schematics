import { NgTemplateOutlet } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { LangDefinition, TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { ButtonDirective } from 'primeng/button'
import { Popover } from 'primeng/popover'

/** Language id -> flag file name (country code) under `assets/images/flags/`. Extend it when adding a language. */
export const LANGUAGE_FLAGS: Readonly<Record<string, string>> = {
  en: 'US',
  tr: 'TR',
}

/** `localStorage` key holding the user's language, read back on bootstrap. */
export const LANGUAGE_STORAGE_KEY = 'currentLanguage'

/** Header language switcher: the active language's flag, and a popover listing Transloco's languages. */
@Component({
  selector: 'app-languages',
  standalone: true,
  imports: [ButtonDirective, NgTemplateOutlet, Popover, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './languages.component.html',
})
export class LanguagesComponent {
  private readonly transloco = inject(TranslocoService)
  private readonly popover = viewChild.required<Popover>('popover')

  /** The active Transloco language. */
  readonly activeLang = toSignal(this.transloco.langChanges$, { initialValue: this.transloco.getActiveLang() })

  /** Ids of the configured languages, in config order. */
  readonly langs: readonly string[] = this.transloco
    .getAvailableLangs()
    .map((lang: string | LangDefinition) => (typeof lang === 'string' ? lang : lang.id))

  protected readonly activeFlag = computed(() => this.flagUrl(this.activeLang()))

  protected flagUrl(lang: string): string {
    return `assets/images/flags/${LANGUAGE_FLAGS[lang] ?? lang.toUpperCase()}.svg`
  }

  /** Activates `lang`, remembers it in `localStorage` and closes the popover. */
  setActiveLang(lang: string): void {
    this.transloco.setActiveLang(lang)
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
    } catch {
      // Storage can be unavailable (private mode, blocked site data); the choice then lasts for the session.
    }
    this.popover().hide()
  }
}
