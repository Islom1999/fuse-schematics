import { IRole } from '../../roles/common/role.model'

/** `GET admin/admins`: an admin account. The password is never returned. */
export interface IAdmin {
  id: string
  email: string
  name: string
  isBlocked: boolean
  lastLoginAt: string | null
  roleId: string | null
  role?: IRole | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface IAdminCreate {
  email: string
  /** At most 120 characters. */
  name: string
  /** 8 to 200 characters. */
  password: string
  roleId?: string | null
}

export type IAdminUpdate = Partial<Pick<IAdminCreate, 'email' | 'name' | 'roleId'>>
