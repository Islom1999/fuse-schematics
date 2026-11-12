import { Component, OnInit, ChangeDetectionStrategy, input, output, signal } from '@angular/core'

import { FormGroup, ReactiveFormsModule } from '@angular/forms'
import { FormlyModule, FormlyFieldConfig } from '@ngx-formly/core'
import { ButtonModule } from 'primeng/button'
import { TranslocoPipe } from '@jsverse/transloco'
import { ITableFilterConfig, convertToFormlyFields } from './table-filter.model'
import { debounceTime } from 'rxjs/operators'

@Component({
  selector: 'app-table-filter',
  standalone: true,
  imports: [ReactiveFormsModule, FormlyModule, ButtonModule, TranslocoPipe],
  templateUrl: './table-filter.component.html',
  styleUrls: ['./table-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableFilterComponent implements OnInit {
  readonly config = input.required<ITableFilterConfig>()
  readonly debounceTime = input(500)
  readonly filterChange = output<Record<string, unknown>>()
  readonly filterReset = output<void>()

  form = new FormGroup({})
  model: Record<string, unknown> = {}
  fields: FormlyFieldConfig[] = []
  readonly isExpanded = signal(false)

  ngOnInit(): void {
    const config = this.config()
    if (!config || !config.fields) {
      console.warn('TableFilterComponent: config or fields not provided')
      return
    }

    this.initializeFilter()
    this.setupFormValueChanges()
  }

  private initializeFilter(): void {
    // Convert IFilterField to FormlyFieldConfig
    this.fields = convertToFormlyFields(this.config().fields)

    // Set initial model values
    this.model = this.config().fields.reduce<Record<string, unknown>>((acc, field) => {
      acc[field.key] = field.defaultValue ?? null
      return acc
    }, {})
  }

  private setupFormValueChanges(): void {
    this.form.valueChanges.pipe(debounceTime(this.debounceTime())).subscribe((values) => {
      // Remove null, undefined, empty string values
      const cleanedValues = this.cleanFilterValues(values)
      this.filterChange.emit(cleanedValues)
    })
  }

  private cleanFilterValues(values: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {}
    Object.keys(values).forEach((key) => {
      const value = values[key]
      if (value !== null && value !== undefined && value !== '') {
        // For arrays (multiselect), check if not empty
        if (Array.isArray(value) && value.length === 0) {
          return
        }
        cleaned[key] = value
      }
    })
    return cleaned
  }

  toggleFilter(): void {
    this.isExpanded.update((expanded) => !expanded)
  }

  /**
   * Keyboard support for the collapsible header (Enter / Space).
   * Ignores key events bubbling up from nested controls (e.g. the reset button).
   */
  onHeaderKeydown(event: Event): void {
    if (event.target !== event.currentTarget) {
      return
    }
    event.preventDefault()
    this.toggleFilter()
  }

  onReset(): void {
    // Reset form to initial state
    this.form.reset()
    this.model = {}
    this.filterReset.emit()
    this.filterChange.emit({})
  }

  get hasActiveFilters(): boolean {
    const values = this.form.value
    return Object.keys(values).some((key) => {
      const value = values[key]
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return value !== null && value !== undefined && value !== ''
    })
  }

  getActiveFiltersCount(): number {
    const values = this.form.value
    return Object.keys(values).filter((key) => {
      const value = values[key]
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return value !== null && value !== undefined && value !== ''
    }).length
  }

  get gridClass(): string {
    const columns = this.config().columns || 3
    return `grid gap-3 md:grid-cols-2 lg:grid-cols-${columns}`
  }
}
