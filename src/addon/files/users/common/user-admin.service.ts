import { Injectable, inject } from '@angular/core'
import { IPagination } from 'app/core/services/base.model'
import { BaseApiService } from 'app/core/services/base.service'
import { ISession } from 'app/shared/models/session.model'
import { TableQueryDTO } from 'app/shared/services/base-crud.service'
import { Observable } from 'rxjs'
import { IUser } from './user.model'

/** Client users. The back-end only reads users, blocks them and manages their device sessions. */
@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private readonly baseApi = inject(BaseApiService)
  private readonly endpoint = 'admin/users'

  getAllPagination(params: TableQueryDTO): Observable<IPagination<IUser[]>> {
    return this.baseApi.post<IPagination<IUser[]>>(`${this.endpoint}/pagination`, { ...params })
  }

  getById(id: string): Observable<IUser> {
    return this.baseApi.get<IUser>(`${this.endpoint}/${id}`)
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
}
