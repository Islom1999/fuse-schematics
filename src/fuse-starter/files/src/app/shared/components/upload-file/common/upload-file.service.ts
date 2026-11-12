import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { IUploadFile } from './upload-file.model'
import { DITokens } from 'app/core/utils/di-tokens'

/** Extra multipart fields; non-Blob values are sent as strings (same as FormData coercion). */
export type UploadExtraData = Record<string, string | number | boolean | Blob>

function appendExtraData(formData: FormData, extraData?: UploadExtraData): void {
  if (!extraData) return
  Object.keys(extraData).forEach((key) => {
    const value = extraData[key]
    formData.append(key, value instanceof Blob ? value : String(value))
  })
}

@Injectable({
  providedIn: 'root',
})
export class UploadFileService {
  private http = inject(HttpClient)
  private apiBaseUrl = inject(DITokens.API_BASE_URL)

  public baseFileUrl = `${this.apiBaseUrl}/files`

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- placeholder keeps its public signature until implemented
  deleteFile(id: string) {
    throw new Error('Method not implemented.')
  }

  /**
   * Bitta faylni upload qilish
   * @param uploadUrl - backend url
   * @param file - upload qilinadigan fayl
   * @param extraData - qo‘shimcha data
   */
  uploadFile(
    uploadUrl: string,
    file: File,
    extraData?: UploadExtraData,
  ): Observable<IUploadFile> {
    const formData = new FormData()
    formData.append('file', file, file?.name)

    appendExtraData(formData, extraData)

    // Oddiy POST
    return this.http.post<IUploadFile>(uploadUrl, formData)
  }

  /**
   * Bir nechta faylni upload qilish
   * @param uploadUrl - backend url
   * @param files - upload qilinadigan fayllar
   * @param extraData - qo‘shimcha data
   */
  uploadFiles(
    uploadUrl: string,
    files: File[],
    extraData?: UploadExtraData,
  ): Observable<IUploadFile[]> {
    const formData = new FormData()

    files.forEach((file) => {
      formData.append('files', file, file?.name)
    })

    appendExtraData(formData, extraData)

    // Oddiy POST → faqat backend javobini qaytaradi
    return this.http.post<IUploadFile[]>(uploadUrl, formData)
  }
}
