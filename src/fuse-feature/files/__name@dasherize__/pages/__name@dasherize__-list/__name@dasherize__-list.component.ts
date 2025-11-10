import { Component, inject, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { GridComponent, IColumn } from 'app/shared/components/grid'
import { TableFilterComponent, ITableFilterConfig } from 'app/shared/components/table-filter'
import { ButtonModule } from 'primeng/button'
import { DialogService } from 'primeng/dynamicdialog'
import { BaseTableComponent } from 'app/shared/abstracts'
import { <%= classify(name) %>GridService, I<%= classify(name) %> } from '../../common'
import { <%= classify(name) %>FormComponent } from '../<%= dasherize(name) %>-form/<%= dasherize(name) %>-form.component'

@Component({
  selector: 'app-<%= dasherize(name) %>',
  standalone: true,
  imports: [CommonModule, GridComponent, TableFilterComponent, ButtonModule],
  providers: [<%= classify(name) %>GridService, DialogService],
  templateUrl: './<%= dasherize(name) %>-list.component.html',
  styleUrls: ['./<%= dasherize(name) %>-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class <%= classify(name) %>ListComponent extends BaseTableComponent<I<%= classify(name) %>> {
  gridService = inject(<%= classify(name) %>GridService)
  formComponent = <%= classify(name) %>FormComponent

  filterConfig: ITableFilterConfig = {
    columns: 1,
    showResetButton: true,
    fields: [
      {
        key: 'name',
        type: 'input',
        label: 'admin.<%= camelize(name) %>.name',
        placeholder: 'admin.<%= camelize(name) %>.namePlaceholder',
      },
    ],
  }

  columns: IColumn[] = [
    {
      field: 'name',
      header: 'admin.<%= camelize(name) %>.fields.name',
    },
    {
      field: 'key',
      header: 'admin.<%= camelize(name) %>.fields.key',
    },
  ]

  protected getItemId(item: I<%= classify(name) %>): string | undefined {
    return item.id
  }

  protected getEditHeaderKey(): string {
    return 'admin.<%= camelize(name) %>.edit'
  }

  protected getCreateHeaderKey(): string {
    return 'admin.<%= camelize(name) %>.create'
  }
}
