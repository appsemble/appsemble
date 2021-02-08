import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  title: '{name} · Resource {resourceName}',
  header: 'Resource {resourceName}',
  resources: 'Resources',
  actions: 'Actions',
  cancelButton: 'Cancel',
  createButton: 'Create',
  newTitle: 'Creating new {resource}',
  createError: 'Something went wrong when creating a new resource.',
  loadError: 'Something went wrong when loading this resource.',
  createSuccess: 'Successfully created resource {id}.',
  notFound:
    'This resource could not be found in the app definition. Please confirm if this resource exists.',
  notManaged: 'This resource is not managed by Appsemble. You can find this resource at {link}',
  export: 'Export as CSV',
});
