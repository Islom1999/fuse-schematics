export type TemplateType = 'custom' | 'id' | 'translate' | 'date' | 'relation'
export type ColumnFilterType = 'text' | 'select' | 'boolean' | 'date'

export interface ColumnFilterOption {
  label: string
  value: unknown
}

export interface IColumn {
  field: string
  header?: string
  headerFunction?: () => string
  template?: TemplateType
  width?: string
  /** `false` turns the sort header off (e.g. relation columns, which the backend cannot sort by). */
  sortable?: boolean
  /** `template: 'relation'`: property of the joined row to show (default `name`, `title`, then `id`). */
  labelField?: string
  is_filter?: boolean
  filterType?: ColumnFilterType
  filterOptions?: ColumnFilterOption[]
  filterPlaceholder?: string
}

export class Column implements IColumn {
  constructor(
    public field: string,
    public header?: string,
    public headerFunction?: () => string,
    public template?: TemplateType,
    public width?: string,
    public is_filter?: boolean,
    public filterType?: ColumnFilterType,
    public filterOptions?: ColumnFilterOption[],
    public filterPlaceholder?: string,
    public sortable?: boolean,
    public labelField?: string,
  ) {}
}

export function createColumn({
  field,
  header,
  headerFunction,
  template,
  width,
  is_filter,
  filterType,
  filterOptions,
  filterPlaceholder,
  sortable,
  labelField,
}: IColumn): Column {
  return new Column(
    field,
    header,
    headerFunction,
    template,
    width,
    is_filter,
    filterType,
    filterOptions,
    filterPlaceholder,
    sortable,
    labelField,
  )
}
