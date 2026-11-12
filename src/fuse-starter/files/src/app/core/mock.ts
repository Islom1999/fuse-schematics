import { Injectable, InjectionToken } from '@angular/core'
import { of } from 'rxjs'

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL')

@Injectable({
  providedIn: 'root',
})
export class MockClient {
  constructor() {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub keeps the real client's signature
  uploadFileToMinIO(path: string, file: { data: File; fileName: string }) {
    // NOTE: MOCK DATA
    return of(null)
  }
}
