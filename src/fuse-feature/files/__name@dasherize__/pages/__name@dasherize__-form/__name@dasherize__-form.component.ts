import { Component, ChangeDetectionStrategy, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule } from '@angular/forms'
import { FormlyModule } from '@ngx-formly/core'
import { BaseFormComponent } from 'app/shared/abstracts'
import { FormActionButtonsComponent } from 'app/shared'
import { Observable } from 'rxjs'
import { I<%= classify(name) %>, <%= classify(name) %>Service } from '../../common'

@Component({
  selector: 'app-<%= dasherize(name) %>-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormlyModule, FormActionButtonsComponent],
  templateUrl: './<%= dasherize(name) %>-form.component.html',
  styleUrls: ['./<%= dasherize(name) %>-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class <%= classify(name) %>FormComponent extends BaseFormComponent<I<%= classify(name) %>> {
  private crudService = inject(<%= classify(name) %>Service)

  protected initFormFields(): void {
    this.fields = [
      {
        key: 'name',
        type: 'input',
        templateOptions: {
          label: 'admin.<%= camelize(name) %>.fields.name',
          required: true,
        },
      },
    ]
  }

  protected getById(id: string, isArchiveView: boolean): Observable<I<%= classify(name) %>> {
    return this.crudService.getById(id, isArchiveView)
  }

  protected create(data: Partial<I<%= classify(name) %>>): Observable<I<%= classify(name) %>> {
    return this.crudService.create(data)
  }

  protected update(
    id: string,
    data: Partial<I<%= classify(name) %>>,
  ): Observable<I<%= classify(name) %>> {
    return this.crudService.update(id, data)
  }

  protected delete(id: string): Observable<I<%= classify(name) %>> {
    return this.crudService.delete(id)
  }

  protected mapToModel(data: I<%= classify(name) %>): Partial<I<%= classify(name) %>> {
    return {}
  }

  protected getDeleteTitle(): string {
    return 'Delete <%= classify(name) %>'
  }

  protected getDeleteMessage(): string {
    return `Are you sure you want to delete "${this.model.id}"?`
  }
}
