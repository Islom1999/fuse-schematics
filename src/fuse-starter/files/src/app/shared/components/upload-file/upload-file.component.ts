import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core'
import { FileType } from 'app/shared/enums/file_type'
import { UploadFileService } from './common/upload-file.service'
import { IUploadFile, UploadFileData } from './common/upload-file.model'
import { Constants } from 'app/core/config/constant.config'
import { ButtonModule } from 'primeng/button'

@Component({
  selector: 'app-upload-file',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadFileComponent {
  readonly multiple = input<boolean>(false)
  readonly acceptType = input<FileType>(FileType.image)
  readonly maxSizeOverride = input<number>()
  readonly uploadUrl = input<string>('')
  readonly files = input<{ id: string }[]>([])
  readonly fileSelected = output<UploadFileData[]>()

  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput')

  /** Selected/uploaded files: reset from the `files` input, then updated locally. */
  readonly selectedFiles = linkedSignal<UploadFileData[]>(() =>
    (this.files() || []).map((file) => ({
      file: null,
      uploadData: { id: file.id } as IUploadFile,
    })),
  )

  FILE_MAX_SIZE = Constants.FILE_MAX_SIZE
  FILE_ALLOWED_MIMES = Constants.FILE_ALLOWED_MIMES

  private _fileService = inject(UploadFileService)

  focusFileInput() {
    const fileInput = this.fileInput()
    if (fileInput?.nativeElement) {
      fileInput.nativeElement.click()
    }
  }

  /** Keyboard support (Enter / Space) for the "Choose file(s)" area. */
  onChooseKeydown(event: Event) {
    event.preventDefault()
    this.focusFileInput()
  }

  getFilePreview(file: UploadFileData): string | null {
    return file.uploadData?.id
      ? `${this._fileService.baseFileUrl}/${file.uploadData.id}/stream`
      : null
  }

  removeFile(file: UploadFileData) {
    this.selectedFiles.update((files) => files.filter((f) => f != file))
    this.fileSelected.emit(this.selectedFiles())
  }

  clearFiles() {
    this.selectedFiles.set([])
    const fileInput = this.fileInput()
    if (fileInput?.nativeElement) {
      fileInput.nativeElement.value = ''
    }
    this.fileSelected.emit([])
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files) return

    const files = Array.from(input.files)
    const validFiles: File[] = []

    for (const file of files) {
      const type = this.detectFileType(file)
      if (!type) continue

      const maxSize = this.maxSizeOverride() ?? this.FILE_MAX_SIZE[FileType.image]
      if (file?.size > maxSize) continue

      validFiles.push(file)
    }

    const uploadFile: UploadFileData[] = []
    if (this.multiple()) {
      this._fileService.uploadFiles(this.uploadUrl(), validFiles).subscribe((event) => {
        event.forEach((file, index) => {
          uploadFile.push({ file: validFiles[index], uploadData: file })
        })

        this.selectedFiles.update((files) => [...files, ...uploadFile])
        this.fileSelected.emit(this.selectedFiles())
      })
    } else {
      if (validFiles[0]) {
        this._fileService.uploadFile(this.uploadUrl(), validFiles[0]).subscribe((event) => {
          uploadFile.push({ file: validFiles[0], uploadData: event })
          this.selectedFiles.set([...uploadFile])
          this.fileSelected.emit(this.selectedFiles())
        })
      }
    }
  }

  private detectFileType(file: File): FileType | null {
    const acceptType = this.acceptType()
    if (this.FILE_ALLOWED_MIMES[acceptType].includes(file?.type)) return acceptType
    return null
  }
}
