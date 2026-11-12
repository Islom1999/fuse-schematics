import { Component, ChangeDetectionStrategy, OnInit, Type, signal } from '@angular/core'
import { FieldType, FieldTypeConfig, FormlyFieldConfig, FormlyModule } from '@ngx-formly/core'
import { FormlyFieldProps } from '@ngx-formly/primeng/form-field'
import { TextareaModule } from 'primeng/textarea'

type JsonProps = FormlyFieldProps

export interface FormlyJsonFieldConfig extends FormlyFieldConfig<JsonProps> {
  type: 'json' | Type<TypeJson>
}

/**
 * Edits a JSON value (object or array) as text. The control holds the parsed value, `null` when
 * the text is empty and a `json` error while the text is not valid JSON.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'type-json',
  standalone: true,
  imports: [TextareaModule, FormlyModule],
  template: `
    <textarea
      #editor
      [value]="text()"
      [formlyAttributes]="field"
      [rows]="props.rows ?? 6"
      (input)="onInput(editor.value)"
      (blur)="formControl.markAsTouched()"
      pTextarea
      fluid
    ></textarea>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeJson extends FieldType<FieldTypeConfig<JsonProps>> implements OnInit {
  text = signal('')

  ngOnInit(): void {
    const value = this.formControl.value
    this.text.set(value == null ? '' : JSON.stringify(value, null, 2))
  }

  onInput(text: string): void {
    this.text.set(text)
    this.formControl.markAsDirty()
    if (!text.trim()) {
      this.formControl.setValue(null)
      return
    }
    try {
      this.formControl.setValue(JSON.parse(text))
    } catch {
      this.formControl.setValue(null)
      this.formControl.setErrors({ json: true })
    }
  }
}
