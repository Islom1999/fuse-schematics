/** Kinds the backend sorts files into (checked from the file content, not the browser MIME). */
export type MediaKind = 'image' | 'video' | 'audio' | 'pdf' | 'other'

export type UploadUsage = 'general' | 'avatar' | 'gallery' | 'document'

/** A row of `media_files` as the upload API returns it. */
export interface MediaFile {
  id: string
  kind: MediaKind
  usage: string
  storage: 'local' | 's3'
  originalName: string
  mime: string
  /** Bytes. */
  size: number
  width: number | null
  height: number | null
  /** Seconds. */
  duration: number | null
  used: boolean
  ownerType: string | null
  ownerId: string | null
  uploadedById: string | null
  uploadedByType: 'admin' | 'user' | null
  /** `/api/files/<id>` (relative to the API origin) or an absolute S3 URL. */
  url: string
  /** Images only. */
  thumbnailUrl: string | null
  createdAt: string
}

export interface UploadOptions {
  usage?: UploadUsage
  /** tus only: bytes per PATCH request. Default 5 MiB. */
  chunkSize?: number
}

export type UploadEvent =
  | { type: 'progress'; loaded: number; total: number; percent: number }
  | { type: 'done'; media: MediaFile }

/** Any upload failure, whatever the transport. `status` is the HTTP status, 0 for network errors. */
export class UploadError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'UploadError'
  }
}
