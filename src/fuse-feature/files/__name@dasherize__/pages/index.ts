export * from './<%= dasherize(name) %>-list/<%= dasherize(name) %>-list.component'<% if (!skipForm) { %>

export * from './<%= dasherize(name) %>-form/<%= dasherize(name) %>-form.component'<% } %>
