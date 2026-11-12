import { Directive, inject, OnInit } from '@angular/core'
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog'
import { UiLoadingService } from '@ui/components/loading-bar'
import { UiConfirmationService } from '@ui/services/confirmation'
import { GridService } from '../components/grid/common/grid.service'
import { IColumn } from '../components/grid/common/column.model'
import { ITableFilterConfig } from '../components/table-filter'
import { Type } from '@angular/core'

@Directive()
export abstract class BaseTableComponent<T> implements OnInit {
  protected loadingService = inject(UiLoadingService)
  protected confirmationService = inject(UiConfirmationService)
  protected dialogService = inject(DialogService)

  protected dialogRef?: DynamicDialogRef

  abstract gridService: GridService<T>
  abstract columns: IColumn[]
  abstract filterConfig: ITableFilterConfig
  abstract formComponent: Type<unknown>
  private filters: Record<string, unknown> = {}

  ngOnInit(): void {
    this.initializeTable()
  }

  protected initializeTable(): void {
    // Override this method for custom initialization
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters = filters
    this.gridService.applyFilters(filters)
  }

  onFilterReset(): void {
    this.gridService.clearFilters()
  }

  onAddClick(): void {
    this.openFormDialog()
  }

  onRowSelect(item: T): void {
    const id = this.getItemId(item)
    if (id) {
      this.openFormDialog(id)
    }
  }

  protected openFormDialog(id?: string): void {
    this.dialogRef = this.dialogService.open(this.formComponent, {
      header: id ? this.getEditHeaderKey() : this.getCreateHeaderKey(),
      width: '50vw',
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      modal: true,
      dismissableMask: false,
      data: {
        id: id,
        isArchiveView: this.gridService.isArchiveView(),
      },
    })

    this.dialogRef.onClose.subscribe((success: boolean) => {
      if (success) {
        this.gridService.applyFilters(this.filters)
      }
    })
  }

  protected abstract getItemId(item: T): string | undefined
  protected abstract getEditHeaderKey(): string
  protected abstract getCreateHeaderKey(): string
}
