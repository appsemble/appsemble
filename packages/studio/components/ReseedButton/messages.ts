import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  reseed: {
    id: 'studio.9FMy4U',
    defaultMessage: 'Reseed App',
  },
  check: {
    id: 'studio.n+I19K',
    defaultMessage:
      'Are you sure you want to reseed this demo app? This will delete all ephemeral resources and assets and will create new ones from the seed.',
  },
  cancel: {
    id: 'studio.47FYwb',
    defaultMessage: 'Cancel',
  },
  submit: {
    id: 'studio.cDnAuK',
    defaultMessage: 'Reseed',
  },
  invalidPermissions: {
    id: 'studio.tSV5V2',
    defaultMessage: 'You do not have permission to reseed this app.',
  },
});
