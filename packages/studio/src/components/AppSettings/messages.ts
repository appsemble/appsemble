import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  chooseFile: 'Choose file…',
  noFile: 'No file chosen',
  icon: 'Icon',
  iconDescription: 'The icon that will be shown to the user.',
  privateLabel: 'App Visibility',
  private: 'Private',
  privateDescription:
    'If checked, prevent this app from appearing on the app list if the user is not part of this app’s organization.',
  path: 'Path',
  pathDescription: 'The path used to access the app.',
  documentation: 'documentation',
  domain: 'Domain name',
  domainDescription:
    'The domain name on which this app is available. For more information on how to set this up, please refer to the {documentation}.',
  domainError: 'This must be a valid domain name without a protocol',
  saveChanges: 'Save changes',
  updateSuccess: 'Successfully updated settings.',
  updateError: 'Something went wrong when trying to update the settings.',
  deleteSuccess: 'Succesfully deleted app {name}',
  delete: 'Delete app',
  deleteHelp: 'Deleting an app cannot be undone.',
  deleteWarningTitle: 'Deleting app',
  deleteWarning: 'Are you sure you want to delete this app? This action cannot be reverted.',
  errorDelete: 'Something went wrong trying to delete this app',
  cancel: 'Cancel',
  dangerZone: 'Dangerous actions',
});
