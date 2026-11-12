import { DecimalPipe } from '@angular/common'
import { inject, LOCALE_ID, Pipe, type PipeTransform } from '@angular/core'

@Pipe({
  name: 'price',
})
export class PricePipe implements PipeTransform {
  private readonly decimalPipe = new DecimalPipe(inject(LOCALE_ID))

  transform(value: number | string | undefined | null): string {
    if (value) return (this.decimalPipe.transform(value, '1.0-0', 'ru') || '0') + ' UZS'

    return '0 UZS'
  }
}
