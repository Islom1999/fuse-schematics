import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { FieldType, FieldTypeConfig, FormlyFieldProps as CoreFieldProps, FormlyModule } from '@ngx-formly/core'
import { MediaKind } from 'app/core/upload/upload.service'
import { UploadFileComponent } from 'app/shared/components/upload-file/upload-file.component'
import { startWith } from 'rxjs'

interface UploadProps extends CoreFieldProps {
  /** Decides the accepted files: image | video | audio | pdf | other. */
  kind?: MediaKind
  /** `true`: the value is an array of media ids; otherwise one media id (or null). */
  multiple?: boolean
}

function toIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((id): id is string => typeof id === 'string' && id !== '')
  return typeof value === 'string' && value !== '' ? [value] : []
}

/**
 * Upload field. The control holds the media id (`imageId`) or an array of ids (`docIds`); the
 * file itself goes through `UploadService` when it is picked, long before the form is saved.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'type-upload',
  standalone: true,
  imports: [FormsModule, FormlyModule, UploadFileComponent],
  template: `
    <app-upload-file
      [kind]="props.kind ?? 'image'"
      [multiple]="!!props.multiple"
      [disabled]="!!props.disabled"
      [ids]="ids()"
      (idsChange)="onIds($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeUpload extends FieldType<FieldTypeConfig<UploadProps>> implements OnInit {
  private destroyRef = inject(DestroyRef)
  protected ids = signal<string[]>([])

  ngOnInit(): void {
    // Follows the control, so an edit form that patches its value later shows the files.
    this.formControl.valueChanges
      .pipe(startWith(this.formControl.value as unknown), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.ids.set(toIds(value)))
  }

  protected onIds(ids: string[]): void {
    this.formControl.setValue(this.props.multiple ? ids : (ids[0] ?? null))
    this.formControl.markAsDirty()
    this.formControl.markAsTouched()
  }
}
