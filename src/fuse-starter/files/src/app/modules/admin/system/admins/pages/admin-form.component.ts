import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { FormlyModule } from '@ngx-formly/core'
import { UserService } from 'app/core/user/user.service'
import { BaseFormComponent } from 'app/shared/abstracts'
import { FormActionButtonsComponent } from 'app/shared/components/form-action-buttons/form-action-buttons.component'
import { AdminFeedbackService } from 'app/shared/services/admin-feedback.service'
import { ButtonModule } from 'primeng/button'
import { map, Observable, of, shareReplay, tap } from 'rxjs'
import { RoleService } from '../../roles/common/role.service'
import { AdminService } from '../common/admin.service'
import { IAdmin } from '../common/admin.model'
import { AdminSecurityComponent } from './admin-security.component'

/** The create form has a password; the edit form has none (use the security section for that). */
type AdminFormModel = IAdmin & { password?: string }

@Component({
  selector: 'app-admin-form',
  imports: [
    ReactiveFormsModule,
    FormlyModule,
    ButtonModule,
    TranslocoPipe,
    FormActionButtonsComponent,
    AdminSecurityComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-form.component.html',
})
export class AdminFormComponent extends BaseFormComponent<AdminFormModel> {
  private readonly adminService = inject(AdminService)
  private readonly roleService = inject(RoleService)
  private readonly users = inject(UserService)
  private readonly transloco = inject(TranslocoService)
  private readonly feedback = inject(AdminFeedbackService)

  protected readonly canWrite = this.users.hasPermission('admin.write')

  /** Role select options; empty without `role.read`. Loaded once, on the first form build. */
  private readonly roleOptions$: Observable<{ label: string; value: string }[]> = (
    this.users.hasPermission('role.read')
      ? this.roleService.getAll().pipe(map((roles) => roles.map((role) => ({ label: role.name, value: role.id }))))
      : of([])
  ).pipe(shareReplay(1))

  protected initFormFields(): void {
    const disabled = !this.canWrite
    this.fields = [
      {
        key: 'email',
        type: 'input',
        props: {
          label: 'admin.system.admins.fields.email',
          type: 'email',
          required: true,
          maxLength: 254,
          disabled,
          translate: true,
        },
      },
      {
        key: 'name',
        type: 'input',
        props: { label: 'admin.system.admins.fields.name', required: true, maxLength: 120, disabled, translate: true },
      },
      ...(this.isEditMode
        ? []
        : [
            {
              key: 'password',
              type: 'input',
              props: {
                label: 'admin.system.admins.fields.password',
                type: 'password',
                required: true,
                minLength: 8,
                maxLength: 200,
                translate: true,
              },
            },
          ]),
      {
        key: 'roleId',
        type: 'select',
        props: {
          label: 'admin.system.admins.fields.role',
          options: this.roleOptions$,
          showClear: true,
          disabled,
          translate: true,
        },
      },
    ]
  }

  protected getById(id: string, isArchiveView: boolean): Observable<AdminFormModel> {
    return this.adminService.getById(id, isArchiveView)
  }

  protected create(data: Partial<AdminFormModel>): Observable<AdminFormModel> {
    return this.adminService.create(data).pipe(this.notify('admin.common.saved'))
  }

  protected update(id: string, data: Partial<AdminFormModel>): Observable<AdminFormModel> {
    // The model also holds read-only fields (id, isBlocked); the backend accepts only these three.
    const { email, name, roleId } = data
    return this.adminService.update(id, { email, name, roleId }).pipe(this.notify('admin.common.saved'))
  }

  protected delete(id: string): Observable<AdminFormModel> {
    return this.adminService.delete(id).pipe(this.notify('admin.common.deleted'))
  }

  protected mapToModel(data: AdminFormModel): Partial<AdminFormModel> {
    return { id: data.id, email: data.email, name: data.name, roleId: data.roleId, isBlocked: data.isBlocked }
  }

  protected getDeleteTitle(): string {
    return this.transloco.translate('admin.system.admins.deleteTitle')
  }

  protected getDeleteMessage(): string {
    return this.transloco.translate('admin.system.admins.deleteMessage', { name: this.model.name })
  }

  /** The admin was blocked or unblocked in the security section: close and refresh the list. */
  protected onBlockedChange(): void {
    this.dialogRef?.close(true)
  }

  private notify(successKey: string) {
    return tap<AdminFormModel>({
      next: () => this.feedback.success(successKey),
      error: (error: unknown) => this.feedback.httpError(error),
    })
  }
}
