/** `GET admin/roles`: a role is a named set of permission keys (`<resource>.<action>`, or `*` for all). */
export interface IRole {
  id: string
  name: string
  permissions: string[]
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface IRoleCreate {
  name: string
  permissions: string[]
}

export type IRoleUpdate = Partial<IRoleCreate>

/** One row of `GET admin/permissions`; the keys are `<resource>.<action>`. */
export interface IPermissionGroup {
  resource: string
  actions: string[]
}
