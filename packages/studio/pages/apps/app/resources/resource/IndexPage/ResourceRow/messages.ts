import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  edit: 'Edit',
  details: 'Details',
  cancelButton: 'Cancel',
  editButton: 'Update',
  editTitle: 'Editing {resource} {id}',
  updateError: 'Something went wrong when updating this resource.',
  updateSuccess: 'Successfully updated resource {id}.',
  deleteButton: 'Delete',
  resourceWarningTitle: 'Deletion Warning',
  resourceWarning:
    'Are you sure you want to delete this resource? Deleted resources can not be recovered.',
  deleteSuccess: 'Successfully deleted resource {id}.',
  deleteError: 'Something went wrong when deleting this resource.',
});
