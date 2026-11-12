import { IBaseModel } from 'app/core/services/base.model'

export interface I<%= classify(name) %> extends IBaseModel {
<%= modelEntityMembers %>
}

export interface I<%= classify(name) %>Create {
<%= modelCreateMembers %>
}

export interface I<%= classify(name) %>Update {
<%= modelUpdateMembers %>
}
