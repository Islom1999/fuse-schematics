import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { FormlyModule } from '@ngx-formly/core'
import { UserService } from 'app/core/user/user.service'
import { BaseFormComponent } from 'app/shared/abstracts'
import { FormActionButtonsComponent } from 'app/shared/components/form-action-buttons/form-action-buttons.component'
import { AdminFeedbackService } from 'app/shared/services/admin-feedback.service'
import { ButtonModule } from 'primeng/button'
import { Observable, tap } from 'rxjs'
import { IPermissionGroup, IRole } from '../common/role.model'
import { RoleService } from '../common/role.service'
import { PermissionPickerComponent } from './permission-picker.component'

@Component({
  selector: 'app-role-form',
  imports: [
    ReactiveFormsModule,
    FormlyModule,
    ButtonModule,
    TranslocoPipe,
    FormActionButtonsComponent,
    PermissionPickerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './role-form.component.html',
})
export class RoleFormComponent extends BaseFormComponent<IRole> {
  private readonly roleService = inject(RoleService)
  private readonly users = inject(UserService)
  private readonly transloco = inject(TranslocoService)
  private readonly feedback = inject(AdminFeedbackService)

  protected readonly canWrite = this.users.hasPermission('role.write')
  protected readonly catalog = signal<IPermissionGroup[]>([])

  override ngOnInit(): void {
    super.ngOnInit()
    this.roleService.permissions().subscribe({
      next: (groups) => this.catalog.set(groups),
      error: (error: unknown) => this.feedback.httpError(error),
    })
  }

  protected initFormFields(): void {
    this.fields = [
      {
        key: 'name',
        type: 'input',
        props: {
          label: 'admin.system.roles.fields.name',
          required: true,
          maxLength: 100,
          disabled: !this.canWrite,
          translate: true,
        },
      },
    ]
  }

  protected onPermissionsChange(permissions: string[]): void {
    this.model.permissions = permissions
    this.cdr.markForCheck()
  }

  protected getById(id: string, isArchiveView: boolean): Observable<IRole> {
    return this.roleService.getById(id, isArchiveView)
  }

  protected create(data: Partial<IRole>): Observable<IRole> {
    return this.roleService
      .create({ name: data.name, permissions: data.permissions ?? [] })
      .pipe(this.notify('admin.common.saved'))
  }

  protected update(id: string, data: Partial<IRole>): Observable<IRole> {
    return this.roleService
      .update(id, { name: data.name, permissions: data.permissions ?? [] })
      .pipe(this.notify('admin.common.saved'))
  }

  protected delete(id: string): Observable<IRole> {
    return this.roleService.delete(id).pipe(this.notify('admin.common.deleted'))
  }

  protected mapToModel(data: IRole): Partial<IRole> {
    return { name: data.name, permissions: data.permissions ?? [] }
  }

  protected getDeleteTitle(): string {
    return this.transloco.translate('admin.system.roles.deleteTitle')
  }

  protected getDeleteMessage(): string {
    return this.transloco.translate('admin.system.roles.deleteMessage', { name: this.model.name })
  }

  private notify(successKey: string) {
    return tap<IRole>({
      next: () => this.feedback.success(successKey),
      error: (error: unknown) => this.feedback.httpError(error),
    })
  }
}
