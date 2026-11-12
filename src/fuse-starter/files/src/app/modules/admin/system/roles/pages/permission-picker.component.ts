import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslocoPipe } from '@jsverse/transloco'
import { UserService } from 'app/core/user/user.service'
import { CheckboxModule } from 'primeng/checkbox'
import { IPermissionGroup } from '../common/role.model'

/** Permission keys are `<resource>.<action>`; `*` grants everything. */
export const ALL_PERMISSIONS = '*'

/**
 * Checkbox grid over the permission catalog (`GET admin/permissions`). A non-super admin can only
 * grant keys they hold, so the others are disabled.
 */
@Component({
  selector: 'app-permission-picker',
  imports: [FormsModule, CheckboxModule, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './permission-picker.component.html',
})
export class PermissionPickerComponent {
  private readonly users = inject(UserService)

  readonly catalog = input<IPermissionGroup[]>([])
  readonly selected = input<string[]>([])
  readonly disabled = input(false)
  readonly selectedChange = output<string[]>()

  protected readonly all = computed(() => this.selected().includes(ALL_PERMISSIONS))
  protected readonly canGrantAll = computed(() => this.users.hasPermission(ALL_PERMISSIONS))

  protected key(group: IPermissionGroup, action: string): string {
    return `${group.resource}.${action}`
  }

  protected isChecked(key: string): boolean {
    return this.all() || this.selected().includes(key)
  }

  protected isDisabled(key: string): boolean {
    return this.disabled() || this.all() || !this.users.hasPermission(key)
  }

  protected toggleAll(checked: boolean): void {
    this.selectedChange.emit(checked ? [ALL_PERMISSIONS] : [])
  }

  protected toggle(key: string, checked: boolean): void {
    const next = this.selected().filter((item) => item !== key)
    this.selectedChange.emit(checked ? [...next, key] : next)
  }

  /** Selects or clears every action of a resource that the current admin may grant. */
  protected toggleGroup(group: IPermissionGroup, checked: boolean): void {
    const keys = group.actions.map((action) => this.key(group, action))
    const grantable = keys.filter((key) => this.users.hasPermission(key))
    const rest = this.selected().filter((item) => !grantable.includes(item))
    this.selectedChange.emit(checked ? [...rest, ...grantable] : rest)
  }

  protected isGroupChecked(group: IPermissionGroup): boolean {
    return group.actions.length > 0 && group.actions.every((action) => this.isChecked(this.key(group, action)))
  }
}
