import { defineMessages } from 'react-intl';

export default defineMessages({
  title: '{name} · Resource {resourceName}',
  resources: 'Resources',
  cancelButton: 'Cancel',
  createButton: 'Create',
  newTitle: 'Creating new {resource}',
  createError: 'Something went wrong when creating a new resource.',
  deleteError: 'Something went wrong when deleting this resource.',
  updateError: 'Something went wrong when updating this resource.',
  loadError: 'Something went wrong when loading this resource.',
  createSuccess: 'Successfully created resource {id}.',
  deleteSuccess: 'Successfully deleted resource {id}.',
  updateSuccess: 'Successfully updated resource {id}.',
  notFound:
    'This resource could not be found in the app definition. Please confirm if this resource exists.',
  notManaged: 'This resource is not managed by Appsemble. You can find this resource at {link}',
  export: 'Export as CSV',
});
