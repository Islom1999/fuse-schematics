import { Pipe, type PipeTransform } from '@angular/core'

@Pipe({
  name: 'objToString',
  standalone: true,
})
export class ObjToStringPipe implements PipeTransform {
  transform(
    value: number | string,
    items: readonly object[] | null,
    valueKey: string,
    labelKey = 'label',
  ): unknown {
    if (!value || !items) {
      return ''
    }

    const match = items.find(
      (item) => (item as Record<string, unknown>)[valueKey] == value,
    ) as Record<string, unknown> | undefined
    return match?.[labelKey] || ''
  }
}
