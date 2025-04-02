import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  modalTitle: {
    id: 'studio.djM9ag',
    defaultMessage: 'Service Secret',
  },
  docs: {
    id: 'studio.9PjpLU',
    defaultMessage: 'Learn more in the <link>documentation</link>',
  },
  nameLabel: {
    id: 'studio.HAlOn1',
    defaultMessage: 'Name',
  },
  nameHelp: {
    id: 'studio.uwcEjh',
    defaultMessage: 'An optional name to give extra clarity what the secret is used for.',
  },
  serviceSecretLabel: {
    id: 'studio.v5qzmw',
    defaultMessage: 'URL pattern(s)',
  },
  serviceSecretHelp: {
    id: 'studio.CthkzB',
    defaultMessage: 'The URL pattern(s) used to match against the request action URL.',
  },
  methodLabel: {
    id: 'studio.Vs3jMi',
    defaultMessage: 'Authentication method',
  },
  methodHelp: {
    id: 'studio.1vGmTm',
    defaultMessage: 'The method of authenticating request actions',
  },
  badServiceSecret: {
    id: 'studio.IRIF+a',
    defaultMessage: 'This must be a valid service secret',
  },
  close: {
    id: 'studio.rbrahO',
    defaultMessage: 'Close',
  },
  save: {
    id: 'studio.cPi5ZN',
    defaultMessage: 'Save service secret',
  },
  deleteWarningTitle: {
    id: 'studio.77W3Mq',
    defaultMessage: 'Deleting service secret',
  },
  deleteWarning: {
    id: 'studio.CiHeL3',
    defaultMessage:
      'Are you sure you want to delete this service secret? This action cannot be reverted.',
  },
  cancel: {
    id: 'studio.47FYwb',
    defaultMessage: 'Cancel',
  },
  delete: {
    id: 'studio.UriWmZ',
    defaultMessage: 'Delete service secret',
  },
  deleteSuccess: {
    id: 'studio.cOA7+s',
    defaultMessage: 'Successfully deleted service secret {name}',
  },
  deleteButton: {
    id: 'studio.UriWmZ',
    defaultMessage: 'Delete service secret',
  },
  publicSecretHelp: {
    id: 'studio.d5mtxM',
    defaultMessage:
      'If a secret is marked public, it can be applied to the unauthenticated users, e.g. in the requests originating in a custom sign up or login page.',
  },
  publicSecretLabel: {
    id: 'studio.uhu5aG',
    defaultMessage: 'Public',
  },
});
