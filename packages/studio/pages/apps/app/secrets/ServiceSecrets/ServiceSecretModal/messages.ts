import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  modalTitle: 'Service Secret',
  docs: 'Learn more in the ',
  serviceNameLabel: 'Service name',
  serviceNameHelp: 'An optional name to give extra clarity what the secret is used for.',
  serviceSecretLabel: 'URL pattern(s)',
  serviceSecretHelp: 'The URL pattern(s) used to match against the request action URL.',
  nameLabel: 'Secret Name',
  nameHelp: 'The name of the secret to use for the authentication',
  methodLabel: 'Authentication method',
  methodHelp: 'The method of authenticating request actions',
  badServiceSecret: 'This must be a valid service secret',
  close: 'Close',
  save: 'Save service secret',
  deleteWarningTitle: 'Deleting service secret',
  deleteWarning:
    'Are you sure you want to delete this service secret? This action cannot be reverted.',
  cancel: 'Cancel',
  delete: 'Delete service secret',
  deleteSuccess: 'Successfully deleted service secret {name}',
  deleteButton: 'Delete service secret',
});
