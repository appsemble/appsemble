import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  header: 'Resource {resourceName}',
  resources: 'Resources',
  actions: 'Actions',
  cancelButton: 'Cancel',
  createButton: 'Create',
  deleteButton: 'Delete',
  delete: 'Delete {amount} {amount, plural, one {resource} other {resources}}',
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
  clonable: 'Clonable',
  resourceWarningTitle: 'Deletion Warning',
  resourceWarning:
    'Are you sure you want to delete {amount, plural, one {this resource} other {these resources}}? Deleted resources can not be recovered.',
  deleteSuccess: 'Successfully deleted the selected resources.',
  deleteError: 'Something went wrong when deleting the selected resources.',
  api: 'API',
});
