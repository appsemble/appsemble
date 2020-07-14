import { defineMessages } from 'react-intl';

export default defineMessages({
  cancelButton: 'Cancel',
  deleteButton: 'Delete',
  editButton: 'Update',
  editTitle: 'Editing {resource} {id}',
  resourceWarningTitle: 'Deletion Warning',
  resourceWarning:
    'Are you sure you want to delete this resource? Deleted resources can not be recovered.',
  updateError: 'Something went wrong when updating this resource.',
  updateSuccess: 'Successfully updated resource {id}.',
  deleteSuccess: 'Successfully deleted resource {id}.',
  deleteError: 'Something went wrong when deleting this resource.',
});
