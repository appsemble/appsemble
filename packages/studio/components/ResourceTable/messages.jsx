import { defineMessages } from 'react-intl';

export default defineMessages({
  title: '{name} · Resource {resourceName}',
  resources: 'Resources',
  cancelButton: 'Cancel',
  createButton: 'Create',
  deleteButton: 'Delete',
  editButton: 'Update',
  newTitle: 'Creating new {resource}',
  editTitle: 'Editing {resource} {id}',
  createError: 'Something went wrong when creating a new resource.',
  deleteError: 'Something went wrong when deleting this resource.',
  updateError: 'Something went wrong when updating this resource.',
  loadError: 'Something went wrong when loading this resource.',
  createSuccess: 'Successfully created resource {id}.',
  deleteSuccess: 'Successfully deleted resource {id}.',
  updateSuccess: 'Successfully updated resource.',
  notFound:
    'This resource could not be found in the app definition. Please confirm if this resource exists.',
  notManaged: 'This resource is not managed by Appsemble. You can find this resource at {link}',
  resourceWarningTitle: 'Deletion Warning',
  resourceWarning:
    'Are you sure you want to delete this resource? Deleted resources can not be recovered.',
});
