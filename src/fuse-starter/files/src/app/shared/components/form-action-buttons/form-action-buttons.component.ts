import { ChangeDetectionStrategy, Component, input, output } from '@angular/core'
import { TranslocoPipe } from '@jsverse/transloco'
import { ButtonModule } from 'primeng/button'

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- public selector used by fuse-feature generated form templates; renaming would break existing features
  selector: 'form-action-buttons',
  standalone: true,
  imports: [TranslocoPipe, ButtonModule],
  templateUrl: './form-action-buttons.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormActionButtonsComponent {
  readonly isEditMode = input<boolean>(false)
  readonly isFormValid = input<boolean>(true)
  readonly showDelete = input<boolean>(true)

  readonly delete = output<void>()
  // eslint-disable-next-line @angular-eslint/no-output-native -- public output (cancel) bound by fuse-feature generated form templates
  readonly cancel = output<void>()
  // eslint-disable-next-line @angular-eslint/no-output-native -- public output (submit) bound by fuse-feature generated form templates
  readonly submit = output<void>()

  onDelete(): void {
    this.delete.emit()
  }

  onCancel(): void {
    this.cancel.emit()
  }

  onSubmit(): void {
    this.submit.emit()
  }
}
