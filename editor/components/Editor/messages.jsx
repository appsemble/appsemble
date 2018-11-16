import { defineMessages } from 'react-intl';

export default defineMessages({
  logoutButton: 'Logout',
  appNotFound: 'App does not exist',
  error: 'Something went wrong trying to load this app',
  errorUpdate: 'Something went wrong trying to update the app recipe',
  errorUpdateIcon: 'Something went wrong trying to update the app icon',
  invalidYaml: 'Invalid YAML',
  updateSuccess: 'Successfully updated app recipe',
  resourceWarningTitle: 'Resource warning',
  resourceWarning:
    'The resource definitions in this app recipe contain different data from the original. This may cause unexpected results when using older data.',
  upload: 'Upload',
  cancel: 'Cancel',
});
