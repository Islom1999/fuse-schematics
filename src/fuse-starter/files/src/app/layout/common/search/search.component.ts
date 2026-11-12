import { DOCUMENT, NgTemplateOutlet } from '@angular/common'
import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Router, RouterLink } from '@angular/router'
import { TranslocoPipe } from '@jsverse/transloco'
import { UiIconComponent } from '@ui'
import { ButtonDirective } from 'primeng/button'
import { debounce, distinctUntilChanged, map, Observable, of, Subject, switchMap, timer } from 'rxjs'
import { SearchService } from './search.service'
import { SearchAppearance, SearchResult, SearchResultSet } from './search.types'

/** Result set ids that have their own row template and a translated group label. */
const KNOWN_GROUPS = new Set(['pages', 'contacts', 'tasks'])

interface ResultGroup {
  set: SearchResultSet
  rows: { result: SearchResult; index: number }[]
}

let nextId = 0

/**
 * Header search. `bar`: an icon button that opens an input over the whole header (the closest positioned
 * ancestor); `basic`: an always-visible input. Results come from `SearchService`.
 */
@Component({
  selector: 'app-search',
  standalone: true,
  imports: [ButtonDirective, NgTemplateOutlet, RouterLink, TranslocoPipe, UiIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search.component.html',
  host: { class: 'app-search' },
})
export class SearchComponent {
  private readonly service = inject(SearchService)
  private readonly router = inject(Router)
  private readonly injector = inject(Injector)
  private readonly document = inject(DOCUMENT)
  private readonly queries = new Subject<string>()
  private readonly input = viewChild<ElementRef<HTMLInputElement>>('input')
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger')

  /** `bar` expands over the header; `basic` is an always-visible input. Layouts use `bar`. */
  readonly appearance = input<SearchAppearance>('basic')
  /** Delay in ms after typing before searching. */
  readonly debounce = input(300)
  /** Minimum trimmed length before searching. */
  readonly minLength = input(2)
  /** Emits each result list as it arrives (`search` in the spec; renamed: it is a native DOM event). */
  readonly searched = output<SearchResultSet[]>()

  /** Bar mode: the overlay is open. */
  readonly opened = signal(false)
  /** The current input text. */
  readonly value = signal('')
  /** `null` before a query ran (or after clearing); `[]` when a query found nothing. */
  readonly results = signal<SearchResultSet[] | null>(null)

  protected readonly id = `app-search-${nextId++}`
  protected readonly activeIndex = signal(-1)
  protected readonly groups = computed<ResultGroup[] | null>(() => {
    let index = 0
    return (
      this.results()?.map((set) => ({ set, rows: set.results.map((result) => ({ result, index: index++ })) })) ?? null
    )
  })
  private readonly options = computed(() => this.groups()?.flatMap((group) => group.rows) ?? [])
  protected readonly activeOptionId = computed(() =>
    this.activeIndex() >= 0 ? this.optionId(this.activeIndex()) : null,
  )

  constructor() {
    this.queries
      .pipe(
        debounce(() => timer(this.debounce())),
        map((value) => value.trim()),
        distinctUntilChanged(),
        switchMap((query): Observable<SearchResultSet[] | null> =>
          query.length < this.minLength() ? of(null) : this.service.search(query),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((results) => {
        this.results.set(results)
        this.activeIndex.set(-1)
        if (results) this.searched.emit(results)
      })

    afterRenderEffect(() => {
      const id = this.activeOptionId()
      if (id) this.document.getElementById(id)?.scrollIntoView({ block: 'nearest' })
    })
  }

  /** Bar mode: shows the overlay and focuses the input. */
  open(): void {
    if (this.opened()) return
    this.opened.set(true)
    afterNextRender(() => this.input()?.nativeElement.focus(), { injector: this.injector })
  }

  /** Bar mode: hides the overlay, clears the input and the results. */
  close(): void {
    this.opened.set(false)
    this.clear()
  }

  protected onInput(value: string): void {
    this.value.set(value)
    this.queries.next(value)
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.options().length
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (!count) return
        event.preventDefault()
        const step = event.key === 'ArrowDown' ? 1 : -1
        this.activeIndex.update((index) => (index < 0 && step < 0 ? count - 1 : (index + step + count) % count))
        break
      }
      case 'Enter': {
        const option = this.options()[this.activeIndex()]
        if (!option) return
        event.preventDefault()
        void this.router.navigateByUrl(option.result.link)
        this.onSelect(option.result)
        break
      }
      case 'Escape':
        if (this.appearance() === 'bar') {
          this.close()
          this.trigger()?.nativeElement.focus()
        } else {
          this.clear()
        }
        break
    }
  }

  /** Basic mode: drop the panel when focus leaves the widget. */
  protected onFocusOut(event: FocusEvent, host: HTMLElement): void {
    if (this.appearance() === 'basic' && !host.contains(event.relatedTarget as Node | null)) {
      this.results.set(null)
      this.activeIndex.set(-1)
    }
  }

  protected onSelect(result: SearchResult): void {
    if (this.appearance() === 'bar') {
      this.close()
      return
    }
    this.clear()
    this.value.set(result.value)
  }

  protected optionId(index: number): string {
    return `${this.id}-option-${index}`
  }

  protected isKnownGroup(id: string): boolean {
    return KNOWN_GROUPS.has(id)
  }

  private clear(): void {
    this.value.set('')
    this.queries.next('')
    this.results.set(null)
    this.activeIndex.set(-1)
  }
}
