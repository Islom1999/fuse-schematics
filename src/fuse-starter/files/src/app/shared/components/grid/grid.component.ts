import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  TemplateRef,
  computed,
  contentChild,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core'
import { CommonModule, NgTemplateOutlet } from '@angular/common'
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms'
import { debounceTime } from 'rxjs/operators'
import { Subscription } from 'rxjs'

import { GridService, getFilterValue } from './common/grid.service'
import { IColumn } from './common/column.model'
import { WrapperBasicComponent } from '../wrapper-basic/wrapper-basic.component'
import { TranslocoPipe } from '@jsverse/transloco'

// PrimeNG imports
import { TableModule, Table, TableLazyLoadEvent } from 'primeng/table'
import { ButtonModule } from 'primeng/button'
import { InputTextModule } from 'primeng/inputtext'
import { SelectModule } from 'primeng/select'
import { PaginatorModule } from 'primeng/paginator'
import { SkeletonModule } from 'primeng/skeleton'
import { SelectButtonChangeEvent, SelectButtonModule } from 'primeng/selectbutton'

/** Payload emitted by p-table (onSort) in single sort mode. */
interface TableSortEvent {
  field?: string
  order?: number
}

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    WrapperBasicComponent,
    NgTemplateOutlet,
    TranslocoPipe,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    SelectButtonModule,
    PaginatorModule,
    SkeletonModule,
  ],
  templateUrl: './grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    ::ng-deep .p-datatable {
      .p-datatable-header {
        background: transparent;
        border: none;
        padding: 1rem;
      }

      .p-datatable-thead > tr > th {
        background-color: #f9fafb;
        color: #374151;
        font-weight: 600;
        border-bottom: 2px solid #e5e7eb;
        padding: 1rem;
      }

      .p-datatable-tbody > tr {
        transition: all 0.2s ease;

        &:hover {
          background-color: #eff6ff !important;
        }

        > td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #f3f4f6;
        }
      }

      .p-paginator {
        background: transparent;
        border-top: 1px solid #e5e7eb;
        padding: 1rem;
        border-radius: 0 0 0.75rem 0.75rem;
      }
    }
  `,
})
export class GridComponent<T> implements AfterViewInit, OnChanges, OnDestroy {
  readonly titleTemplate = input<TemplateRef<unknown>>()
  readonly templateFilters = input<TemplateRef<unknown>>()
  readonly templateCostumFields = input<TemplateRef<unknown>>()

  readonly title = input<string | TemplateRef<unknown>>()
  readonly columns = input<IColumn[]>([])
  readonly selectionMode = input<'single' | 'multiple'>('single')
  readonly addButtonText = input("Qo'shish")
  readonly addButtonIcon = input<string>()
  readonly showAddButton = input(true)
  readonly showExportButton = input(false)
  readonly showExportButtons = input(false)
  readonly showArchiveSplitButton = input(false)
  readonly $data = input.required<GridService<T>>()

  // eslint-disable-next-line @angular-eslint/no-output-on-prefix -- public output (onClickAdd) bound by fuse-feature generated list templates
  readonly onClickAdd = output<void>()
  // eslint-disable-next-line @angular-eslint/no-output-on-prefix -- public output (onRowSelect) bound by fuse-feature generated list templates
  readonly onRowSelect = output<T>()

  readonly table = viewChild<Table>('dt')
  /** Optional filter template projected by the parent: `<ng-template #costumTableFilter>` */
  readonly customTableFilterTemplate = contentChild<TemplateRef<unknown>>('costumTableFilter')

  /** Rows of the current page (derived from the grid service signals). */
  readonly dataSource = computed(() => this.$data().data())
  readonly isLoading = computed(() => this.$data().isLoading())
  readonly filterableColumns = computed(() =>
    (this.columns() || []).filter((column) => column.is_filter === true && !!column.field),
  )

  sortField?: string
  sortOrder: number = 1

  private readonly fb = inject(FormBuilder)

  filterForm: FormGroup = this.fb.group({})
  private filterChangesSub?: Subscription

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns']) {
      this.buildFilterForm()
    }
  }

  ngAfterViewInit(): void {
    const data = this.$data()
    data.onLoadPage({
      pageIndex: data.pageEvent.pageIndex,
      pageSize: data.pageEvent.pageSize,
      length: data.totalRecords(),
    })
  }

  onPageChange(event: TableLazyLoadEvent): void {
    // PrimeNG onLazyLoad event.first ni beradi (offset), event.page emas
    // first = pageIndex * pageSize
    const pageIndex = Math.floor(event.first / event.rows)

    this.$data().onLoadPage({
      pageIndex: pageIndex,
      pageSize: event.rows,
      length: this.$data().totalRecords(),
      // Grid uses single sort mode, so sortField is never a string[] here
      sortField: event.sortField as string | undefined,
      sortOrder: event.sortOrder,
    })
  }

  onSort(event: TableSortEvent): void {
    this.$data().onLoadPage({
      sortField: event.field,
      sortOrder: event.order,
    })
  }

  ngOnDestroy(): void {
    this.filterChangesSub?.unsubscribe()
  }

  get displayedColumns(): string[] {
    return this.columns().map((column) => column.field)
  }

  get hasActiveFilters(): boolean {
    const filterableColumns = this.filterableColumns()
    if (!filterableColumns.length) {
      return false
    }

    const activeFilters = this.$data().filterSort.filters || {}
    return filterableColumns.some((column) => {
      const value = activeFilters[column.field]
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return value !== undefined && value !== null && value !== ''
    })
  }

  handleRowClick(row: T): void {
    this.onRowSelect.emit(row)
  }

  exportToExcel(): void {
    // Export logic if needed
  }

  isTemplateRef(value: unknown): value is TemplateRef<unknown> {
    return value instanceof TemplateRef
  }

  getFilterLabel(column: IColumn): string {
    return column.filterPlaceholder || column.header || column.field
  }

  clearSingleFilter(field: string): void {
    const control = this.filterForm.get(field) as FormControl | null
    if (!control) {
      return
    }
    if (control.value === '' || control.value === undefined || control.value === null) {
      return
    }
    control.setValue('', { emitEvent: true })
  }

  resetFilters(): void {
    const filterableColumns = this.filterableColumns()
    if (!filterableColumns.length) {
      return
    }

    const resetPayload: Record<string, string> = {}
    filterableColumns.forEach((column) => {
      resetPayload[column.field] = ''
    })

    this.filterForm.patchValue(resetPayload, { emitEvent: false })
    this.$data().clearFilters()
  }

  private buildFilterForm(): void {
    this.filterChangesSub?.unsubscribe()

    const filterableColumns = this.filterableColumns()
    if (!filterableColumns.length) {
      this.filterForm = this.fb.group({})
      return
    }

    const controls: Record<string, FormControl<unknown>> = {}
    const activeFilters = this.$data().filterSort.filters || {}

    filterableColumns.forEach((column) => {
      const initialValue = getFilterValue(activeFilters[column.field]) ?? ''
      controls[column.field] = this.fb.control(initialValue)
    })

    this.filterForm = this.fb.group(controls)

    this.filterChangesSub = this.filterForm.valueChanges
      .pipe(debounceTime(300))
      .subscribe((value) => this.$data().applyFilters(value))
  }

  onArchiveViewChange(event: SelectButtonChangeEvent): void {
    const data = this.$data()
    data.isArchiveView.set(event.value)
    data.onLoadPage({
      pageIndex: 0,
      pageSize: data.pageEvent.pageSize,
      length: data.totalRecords(),
    })
  }
}
