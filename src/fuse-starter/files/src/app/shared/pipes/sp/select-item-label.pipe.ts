import { Pipe, type PipeTransform } from '@angular/core'
import { ObjToStringPipe } from './obj-to-string.pipe'

@Pipe({
  name: 'selectItemLabel',
  standalone: true,
})
export class SelectItemLabelPipe extends ObjToStringPipe implements PipeTransform {
  override transform(value: number | string, items: readonly object[] | null): unknown {
    return super.transform(value, items, 'value')
  }
}
