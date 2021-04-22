import { defineMessages } from 'react-intl';

export const messages = defineMessages({
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
  id: 'ID',
  author: 'Author',
  hideButton: 'Hide columns ({count}/{total})',
  apply: 'Apply',
  hideProperties: 'Hide properties',
  hideExplanation:
    'Hide properties from the table. Hidden properties will also be hidden when exporting the properties as CSV.',
  created: 'Created',
  updated: 'Updated',
});
