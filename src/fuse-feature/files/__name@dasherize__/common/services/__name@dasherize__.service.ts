import { Injectable } from '@angular/core'
import { BaseCrudService } from 'app/shared/services/base-crud.service'
import { I<%= classify(name) %> } from '../models/<%= dasherize(name) %>.model'

@Injectable({ providedIn: 'root' })
export class <%= classify(name) %>Service extends BaseCrudService<I<%= classify(name) %>> {
  constructor() {
    super('admin/<%= dasherize(name) %>')
  }
}
