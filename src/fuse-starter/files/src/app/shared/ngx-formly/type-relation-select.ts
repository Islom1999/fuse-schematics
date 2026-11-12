import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  Type,
  computed,
  inject,
  signal,
} from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ReactiveFormsModule } from '@angular/forms'
import { FieldType, FieldTypeConfig, FormlyFieldConfig, FormlyModule } from '@ngx-formly/core'
import { FormlyFieldProps } from '@ngx-formly/primeng/form-field'
import { BaseApiService } from 'app/core/services/base.service'
import { MultiSelect } from 'primeng/multiselect'
import { Select } from 'primeng/select'
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  merge,
  of,
  startWith,
  switchMap,
} from 'rxjs'

/** One row of `GET admin/<resource>/options`. */
export interface RelationOption {
  id: string
  label: string
}

interface RelationSelectProps extends FormlyFieldProps {
  /** Options endpoint relative to the API base URL, e.g. `admin/category/options`. */
  endpoint: string
  /** `true`: `p-multiselect` bound to an array of ids; otherwise `p-select` bound to one id. */
  multiple?: boolean
  /** Label column of the target, sent as `?label=` (default: the backend's choice). */
  labelField?: string
  /** Rows loaded per search (backend: 1..100). */
  limit?: number
  appendTo?: Select['appendTo']
}

export interface FormlyRelationSelectFieldConfig extends FormlyFieldConfig<RelationSelectProps> {
  type: 'relation-select' | Type<TypeRelationSelect>
}

const DEFAULT_LIMIT = 20
const MAX_IDS = 100
const SEARCH_DEBOUNCE_MS = 300

/** The ids held by the control: `null` / `''` → none, one id → `[id]`, a list → itself. */
function toIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((id): id is string => typeof id === 'string' && id !== '')
  return typeof value === 'string' && value !== '' ? [value] : []
}

/**
 * Relation picker fed by the backend's `GET admin/<resource>/options?search=&ids=&limit=&label=`
 * (`{ id, label }[]`). Options load lazily: the first page when the field is created, then one
 * request per (debounced) search in the dropdown filter. The current value(s) of the control are
 * fetched with `ids=`, so an edit form shows the label even when it is not on the first page.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'type-relation-select',
  standalone: true,
  imports: [ReactiveFormsModule, FormlyModule, Select, MultiSelect],
  template: `
    @if (props.multiple) {
      <p-multiselect
        [placeholder]="props.placeholder"
        [options]="choices()"
        [formControl]="formControl"
        [formlyAttributes]="field"
        [showClear]="!props.required"
        [appendTo]="props.appendTo"
        [loading]="loading()"
        [filter]="true"
        [resetFilterOnHide]="true"
        optionLabel="label"
        optionValue="id"
        [maxSelectedLabels]="3"
        (onFilter)="search($event.filter)"
        fluid
      />
    } @else {
      <p-select
        [placeholder]="props.placeholder"
        [options]="choices()"
        [formControl]="formControl"
        [formlyAttributes]="field"
        [showClear]="!props.required"
        [appendTo]="props.appendTo"
        [loading]="loading()"
        [filter]="true"
        [resetFilterOnHide]="true"
        optionLabel="label"
        optionValue="id"
        (onFilter)="search($event.filter)"
        fluid
      />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeRelationSelect extends FieldType<FieldTypeConfig<RelationSelectProps>> implements OnInit {
  private api = inject(BaseApiService)
  private destroyRef = inject(DestroyRef)
  private query$ = new Subject<string>()
  private pending = signal(0)

  /** Rows of the last search. */
  private found = signal<RelationOption[]>([])
  /** Rows of the selected ids, kept so their labels survive the next search. */
  private selected = signal<RelationOption[]>([])

  protected loading = computed(() => this.pending() > 0)
  protected choices = computed(() => {
    const found = this.found()
    return [...found, ...this.selected().filter((s) => !found.some((f) => f.id === s.id))]
  })

  ngOnInit(): void {
    // First page, then one request per debounced search; a newer search cancels the older one.
    merge(of(''), this.query$.pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged()))
      .pipe(
        switchMap((search) => this.fetch({ search })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((rows) => this.found.set(rows))

    // Current value(s): reuse the loaded rows, ask `ids=` for the rest (edit form, other pages).
    this.formControl.valueChanges
      .pipe(
        startWith(this.formControl.value),
        map(toIds),
        distinctUntilChanged((a, b) => a.join() === b.join()),
        switchMap((ids) => {
          const known = this.choices().filter((o) => ids.includes(o.id))
          this.selected.set(known)
          const missing = ids.filter((id) => !known.some((o) => o.id === id)).slice(0, MAX_IDS)
          return missing.length ? this.fetch({ ids: missing.join(','), limit: missing.length }) : EMPTY
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((rows) => this.selected.update((selected) => [...selected, ...rows]))
  }

  protected search(text: string | null | undefined): void {
    this.query$.next((text ?? '').trim())
  }

  private fetch(params: { search?: string; ids?: string; limit?: number }): Observable<RelationOption[]> {
    this.pending.update((n) => n + 1)
    return this.api
      .get<RelationOption[]>(this.props.endpoint, {
        queryParams: {
          limit: params.limit ?? this.props.limit ?? DEFAULT_LIMIT,
          ...(params.search ? { search: params.search } : {}),
          ...(params.ids ? { ids: params.ids } : {}),
          ...(this.props.labelField ? { label: this.props.labelField } : {}),
        },
      })
      .pipe(
        map((rows) => (Array.isArray(rows) ? rows : [])),
        catchError(() => of([] as RelationOption[])),
        finalize(() => this.pending.update((n) => n - 1)),
      )
  }
}
