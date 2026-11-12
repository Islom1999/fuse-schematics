import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms'

const MUST_MATCH = 'mustMatch'

export class UiValidators {
  /** `null`/`undefined`, or a value whose `length` is 0. */
  static isEmptyInputValue(value: unknown): boolean {
    if (value === null || value === undefined) return true
    const length = (value as { length?: unknown }).length
    return typeof length === 'number' && length === 0
  }

  /**
   * Group-level validator: the control at `matchingControlPath` must equal the one at `controlPath`
   * (dot-delimited `FormGroup.get` paths). The `mustMatch` error is also set on the matching control,
   * next to its other errors.
   */
  static mustMatch(controlPath: string, matchingControlPath: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const control = group.get(controlPath)
      const matching = group.get(matchingControlPath)
      if (!control || !matching) return null

      if (matching.hasError(MUST_MATCH)) {
        const rest = { ...matching.errors }
        delete rest[MUST_MATCH]
        matching.setErrors(Object.keys(rest).length ? rest : null, { emitEvent: false })
      }

      if (UiValidators.isEmptyInputValue(matching.value) || control.value === matching.value) return null

      matching.setErrors({ ...matching.errors, [MUST_MATCH]: true }, { emitEvent: false })
      return { [MUST_MATCH]: true }
    }
  }
}
