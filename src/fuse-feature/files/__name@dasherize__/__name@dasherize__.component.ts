import { Component, inject, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { GridComponent, IColumn, GridService } from 'app/shared/components/grid'
import { TableFilterComponent, ITableFilterConfig } from 'app/shared/components/table-filter'
import { I<%= classify(name) %> } from './common/<%= dasherize(name) %>.model'
import { ButtonModule } from 'primeng/button'
import { DialogService } from 'primeng/dynamicdialog'
import { <%= classify(name) %>FormComponent } from './<%= dasherize(name) %>-form/<%= dasherize(name) %>-form.component'
import { BaseTableComponent } from 'app/shared/abstracts'
import { <%= classify(name) %>GridService } from './common/<%= dasherize(name) %>-grid.service'

@Component({
  selector: '<%= prefix %>-<%= dasherize(name) %>',
  standalone: true,
  imports: [CommonModule, GridComponent, TableFilterComponent, ButtonModule],
  providers: [{ provide: GridService, useClass: <%= classify(name) %>GridService }, DialogService],
  templateUrl: './<%= dasherize(name) %>.component.html',
  styleUrls: ['./<%= dasherize(name) %>.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class <%= classify(name) %>Component extends BaseTableComponent<I<%= classify(name) %>> {
  gridService = inject(GridService<I<%= classify(name) %>>)
  formComponent = <%= classify(name) %>FormComponent

  filterConfig: ITableFilterConfig = {
    columns: 1,
    showResetButton: true,
    fields: [],
  }

  columns: IColumn[] = []

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
