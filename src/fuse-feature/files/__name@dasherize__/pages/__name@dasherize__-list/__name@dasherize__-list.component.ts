import { Component, inject, ChangeDetectionStrategy<% if (skipForm) { %>, Type<% } %> } from '@angular/core'
import { CommonModule } from '@angular/common'
import { GridComponent, IColumn } from 'app/shared/components/grid'
import { TableFilterComponent, ITableFilterConfig } from 'app/shared/components/table-filter'
import { ButtonModule } from 'primeng/button'
import { DialogService } from 'primeng/dynamicdialog'
import { BaseTableComponent } from 'app/shared/abstracts'
import { <%= classify(name) %>GridService, I<%= classify(name) %> } from '../../common'
<% if (!skipForm) { %>import { <%= classify(name) %>FormComponent } from '../<%= dasherize(name) %>-form/<%= dasherize(name) %>-form.component'
<% } %>
@Component({
  selector: '<%= prefix %>-<%= dasherize(name) %>',
  standalone: true,
  imports: [CommonModule, GridComponent, TableFilterComponent, ButtonModule],
  providers: [<%= classify(name) %>GridService, DialogService],
  templateUrl: './<%= dasherize(name) %>-list.component.html',
  styleUrls: ['./<%= dasherize(name) %>-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class <%= classify(name) %>ListComponent extends BaseTableComponent<I<%= classify(name) %>> {
  gridService = inject(<%= classify(name) %>GridService)
<% if (!skipForm) { %>  formComponent = <%= classify(name) %>FormComponent
<% } else { %>  // Form komponenti yaratilmagan (--skipForm). Kerak bo'lsa, o'z komponentingizni shu yerga ulang.
  formComponent!: Type<unknown>
<% } %>
  filterConfig: ITableFilterConfig = <%= filterConfigCode %>

  columns: IColumn[] = <%= columnsCode %>

  protected getItemId(item: I<%= classify(name) %>): string | undefined {
    return item.id
  }

  protected getEditHeaderKey(): string {
    return 'admin.<%= camelize(name) %>.edit'
  }

  protected getCreateHeaderKey(): string {
    return 'admin.<%= camelize(name) %>.create'
  }<% if (skipForm) { %>

  // Form yo'q: qator tanlanganda dialog ochilmaydi
  protected override openFormDialog(): void {}<% } %>
}
