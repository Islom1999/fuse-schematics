import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core'
import { TranslocoService } from '@jsverse/transloco'
import { MediaFile, MediaKind, UPLOAD_ACCEPT, UploadError, UploadService } from 'app/core/upload/upload.service'
import { ButtonModule } from 'primeng/button'
import { ProgressBarModule } from 'primeng/progressbar'
import { Subscription } from 'rxjs'

type ItemStatus = 'loading' | 'uploading' | 'done' | 'error'

interface UploadItem {
  key: number
  /** The media id; set once the upload finished or when the item came from `ids`. */
  id?: string
  media?: MediaFile
  name: string
  size?: number
  progress: number
  status: ItemStatus
  error?: string
  /** Object URL of the local file, for an image preview while (and after) uploading. */
  localUrl?: string
  sub?: Subscription
}

/**
 * File picker that uploads through `UploadService`. The value is a list of media ids: bind `ids`
 * and listen to `idsChange`. Shows progress with a cancel button while uploading, then an image
 * preview (images) or the file name with a remove button. Existing ids are looked up with
 * `UploadService.get` so an edit form shows its files. Removing only drops the id from the value;
 * the backend deletes files that no record references after a while.
 */
@Component({
  selector: 'app-upload-file',
  standalone: true,
  imports: [ButtonModule, ProgressBarModule],
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadFileComponent {
  /** Decides the file dialog filter; `other` accepts anything. */
  readonly kind = input<MediaKind>('image')
  readonly multiple = input<boolean>(false)
  readonly disabled = input<boolean>(false)
  /** Current value: media ids. */
  readonly ids = input<string[]>([])
  readonly idsChange = output<string[]>()

  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput')
  private readonly service = inject(UploadService)
  private readonly transloco = inject(TranslocoService, { optional: true })

  protected readonly items = signal<UploadItem[]>([])
  protected readonly accept = computed(() => UPLOAD_ACCEPT[this.kind()])
  protected readonly canAdd = computed(
    () => !this.disabled() && (this.multiple() || this.items().length === 0),
  )

  private nextKey = 0

  constructor() {
    effect(() => {
      const ids = this.ids()
      untracked(() => this.sync(ids))
    })
    inject(DestroyRef).onDestroy(() => this.items().forEach((item) => this.dispose(item)))
  }

  /** Text through Transloco, with the English default when the key is not translated. */
  protected t(key: string, fallback: string): string {
    const text = this.transloco?.translate(key)
    return !text || text === key ? fallback : text
  }

  protected previewUrl(item: UploadItem): string | null {
    if (item.localUrl) return item.localUrl
    if (item.media?.kind === 'image') return this.service.urlFor(item.media, true)
    return null
  }

  protected fileUrl(item: UploadItem): string | null {
    return item.media ? this.service.urlFor(item.media) : null
  }

  protected sizeLabel(bytes: number | undefined): string {
    if (!bytes) return ''
    return bytes >= 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  protected choose(): void {
    this.fileInput()?.nativeElement.click()
  }

  protected onFilesPicked(event: Event): void {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files ?? [])
    input.value = ''
    if (!files.length) return

    if (!this.multiple()) {
      this.items().forEach((item) => this.dispose(item))
      this.items.set([])
      this.emit()
    }
    for (const file of this.multiple() ? files : files.slice(0, 1)) this.start(file)
  }

  /** Cancels a running upload, or removes a finished / failed entry. */
  protected remove(item: UploadItem): void {
    const hadId = !!item.id
    this.dispose(item)
    this.items.update((items) => items.filter((i) => i !== item))
    if (hadId) this.emit()
  }

  private start(file: File): void {
    const item: UploadItem = {
      key: this.nextKey++,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading',
      localUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }
    this.items.update((items) => [...items, item])

    item.sub = this.service.upload(file).subscribe({
      next: (event) => {
        if (event.type === 'progress') {
          this.patch(item, { progress: event.percent })
        } else {
          item.sub = undefined
          this.patch(item, {
            id: event.media.id,
            media: event.media,
            name: event.media.originalName,
            progress: 100,
            status: 'done',
          })
          this.emit()
        }
      },
      error: (error: unknown) => {
        item.sub = undefined
        this.patch(item, { status: 'error', error: this.errorText(error) })
      },
    })
  }

  /** Makes the list match `ids` (value changed from outside): fetches records for new ids. */
  private sync(ids: string[]): void {
    const current = this.items()
    const have = current.filter((item) => item.id).map((item) => item.id)
    if (have.length === ids.length && have.every((id, index) => id === ids[index])) return

    const byId = new Map(current.filter((item) => item.id).map((item) => [item.id, item]))
    const kept = ids.map((id) => byId.get(id) ?? this.load(id))
    current.filter((item) => item.id && !ids.includes(item.id)).forEach((item) => this.dispose(item))
    // Uploads in progress (and failed ones) stay where they are, after the known files.
    this.items.set([...kept, ...current.filter((item) => !item.id)])
  }

  private load(id: string): UploadItem {
    const item: UploadItem = { key: this.nextKey++, id, name: id, progress: 100, status: 'loading' }
    item.sub = this.service.get(id).subscribe({
      next: (media) => {
        item.sub = undefined
        this.patch(item, { media, name: media.originalName, size: media.size, status: 'done' })
      },
      // The record cannot be read (no permission, deleted): keep the id, show it as the name.
      error: () => {
        item.sub = undefined
        this.patch(item, { status: 'done' })
      },
    })
    return item
  }

  private patch(item: UploadItem, changes: Partial<UploadItem>): void {
    Object.assign(item, changes)
    this.items.update((items) => [...items])
  }

  private dispose(item: UploadItem): void {
    item.sub?.unsubscribe()
    item.sub = undefined
    if (item.localUrl) URL.revokeObjectURL(item.localUrl)
    item.localUrl = undefined
  }

  private emit(): void {
    this.idsChange.emit(
      this.items()
        .filter((item) => item.id)
        .map((item) => item.id as string),
    )
  }

  private errorText(error: unknown): string {
    const status = error instanceof UploadError ? error.status : 0
    if (status === 413) return this.t('upload.error.size', 'The file is too large')
    if (status === 415) return this.t('upload.error.type', 'This file type is not allowed')
    return this.t('upload.error.failed', 'Upload failed')
  }
}
