import { Injectable } from '@angular/core'
import { ISession } from 'app/shared/models/session.model'
import { BaseCrudService } from 'app/shared/services/base-crud.service'
import { Observable } from 'rxjs'
import { IAdmin } from './admin.model'

@Injectable({ providedIn: 'root' })
export class AdminService extends BaseCrudService<IAdmin> {
  constructor() {
    super('admin/admins')
  }

  /** Blocking ends all sessions of the admin. */
  setBlocked(id: string, isBlocked: boolean): Observable<IAdmin> {
    return this.baseApi.put<IAdmin>(`${this.endpoint}/${id}/block`, { isBlocked })
  }

  setRole(id: string, roleId: string | null): Observable<IAdmin> {
    return this.baseApi.put<IAdmin>(`${this.endpoint}/${id}/role`, { roleId })
  }

  /** Sets a new password and ends the admin's sessions. */
  setPassword(id: string, password: string): Observable<{ success: boolean }> {
    return this.baseApi.put<{ success: boolean }>(`${this.endpoint}/${id}/password`, { password })
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
