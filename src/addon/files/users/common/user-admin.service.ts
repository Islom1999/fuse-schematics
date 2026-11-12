import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { IPagination } from 'app/core/services/base.model'
import { BaseApiService } from 'app/core/services/base.service'
import { DITokens } from 'app/core/utils/di-tokens'
import { ISession } from 'app/shared/models/session.model'
import { TableQueryDTO } from 'app/shared/services/base-crud.service'
import { Observable } from 'rxjs'
import { IPushDevice, IUser, IUserCreate, IUserDeleted, IUserUpdate } from './user.model'

/** Client users: full CRUD, block, device sessions and push devices. */
@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private readonly baseApi = inject(BaseApiService)
  // BaseApiService has no PATCH; the update route is a PATCH.
  private readonly http = inject(HttpClient)
  private readonly apiBaseUrl = inject(DITokens.API_BASE_URL)
  private readonly endpoint = 'admin/users'

  getAllPagination(params: TableQueryDTO): Observable<IPagination<IUser[]>> {
    return this.baseApi.post<IPagination<IUser[]>>(`${this.endpoint}/pagination`, { ...params })
  }

  getById(id: string): Observable<IUser> {
    return this.baseApi.get<IUser>(`${this.endpoint}/${id}`)
  }

  /** 409 when the phone or the email is taken. */
  create(body: IUserCreate): Observable<IUser> {
    return this.baseApi.post<IUser>(this.endpoint, body)
  }

  /** `PATCH`; 409 when the phone or the email is taken. `isBlocked: true` ends all sessions. */
  update(id: string, body: IUserUpdate): Observable<IUser> {
    return this.http.patch<IUser>(`${this.apiBaseUrl}/${this.endpoint}/${id}`, body)
  }

  /** Soft delete: phone and email become free again and every session is revoked. */
  delete(id: string): Observable<IUserDeleted> {
    return this.baseApi.delete<IUserDeleted>(`${this.endpoint}/${id}`)
  }

  /** Blocking ends all sessions of the user. */
  setBlocked(id: string, isBlocked: boolean): Observable<IUser> {
    return this.baseApi.put<IUser>(`${this.endpoint}/${id}/block`, { isBlocked })
  }

  sessions(id: string): Observable<ISession[]> {
    return this.baseApi.get<ISession[]>(`${this.endpoint}/${id}/sessions`)
  }

  revokeSessions(id: string): Observable<{ revoked: number }> {
    return this.baseApi.delete<{ revoked: number }>(`${this.endpoint}/${id}/sessions`)
  }

  revokeSession(id: string, sessionId: string): Observable<{ success: boolean }> {
    return this.baseApi.delete<{ success: boolean }>(`${this.endpoint}/${id}/sessions/${sessionId}`)
  }

  /** Needs `notification.read` and the back-end `notifications` add-on. */
  pushDevices(id: string): Observable<IPushDevice[]> {
    return this.baseApi.get<IPushDevice[]>(`${this.endpoint}/${id}/push-devices`)
  }
}
