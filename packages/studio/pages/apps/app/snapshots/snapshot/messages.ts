import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  title: {
    id: 'studio.nw/pN6',
    defaultMessage: 'Snapshot {name}',
  },
  noSnapshot: {
    id: 'studio.llfjrj',
    defaultMessage: 'This snapshot couldn’t be found. Is its ID correct?',
  },
  error: {
    id: 'studio.bssHGo',
    defaultMessage:
      'Something went wrong when trying to fetch this snapshot. Its ID may be incorrect.',
  },
  loading: {
    id: 'studio.VlRFUO',
    defaultMessage: 'Loading snapshot…',
  },
  restoreButton: {
    id: 'studio.2Vfoqz',
    defaultMessage: 'Restore snapshot',
  },
  restoringTitle: {
    id: 'studio.W17A03',
    defaultMessage: 'Restoring snapshot',
  },
  cancel: {
    id: 'studio.47FYwb',
    defaultMessage: 'Cancel',
  },
  restoreDescription: {
    id: 'studio.V/Rfef',
    defaultMessage: 'Are you sure you want to restore this snapshot?',
  },
  restoreError: {
    id: 'studio.p7eeK6',
    defaultMessage: 'Something went wrong when trying to restore this snapshot.',
  },
  restoreSuccess: {
    id: 'studio./GQ0qj',
    defaultMessage: 'Successfully restored this snapshot.',
  },
});
