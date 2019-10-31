import { defineMessages } from 'react-intl';

export default defineMessages({
  chooseFile: 'Choose file…',
  noFile: 'No file chosen',
  icon: 'Icon',
  iconDescription: 'The icon that will be shown to the user.',
  privateLabel: 'App Visibility',
  private: 'Private',
  privateDescription:
    'If checked, prevent this app from appearing on the app list if the user is not part of this app’s organization.',
  path: 'Path',
  pathDescription: 'The path used to access the app. This is relative to {basePath}.',
  documentation: 'documentation',
  domain: 'Domain name',
  domainDescription:
    'The domain name on which this app is available. For more information on how to set this up, please refer to the {documentation}.',
  saveChanges: 'Save changes',
  updateSuccess: 'Successfully updated settings.',
  updateError: 'Something went wrong when trying to update the settings.',
});
