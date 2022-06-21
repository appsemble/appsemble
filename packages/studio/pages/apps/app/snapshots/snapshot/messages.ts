import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  title: 'Snapshot {name}',
  noSnapshot: 'This snapshot couldn’t be found. Is its ID correct?',
  error: 'Something went wrong when trying to fetch this snapshot. Its ID may be incorrect.',
  loading: 'Loading snapshot…',
  restoreButton: 'Restore snapshot',
  restoringTitle: 'Restoring snapshot',
  cancel: 'Cancel',
  restoreDescription: 'Are you sure you want to restore this snapshot?',
  restoreError: 'Something went wrong when trying to restore this snapshot.',
  restoreSuccess: 'Successfully restored this snapshot.',
});
