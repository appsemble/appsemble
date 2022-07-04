import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  title: 'Editor',
  errorUpdate: 'Something went wrong trying to update the app definition',
  updateSuccess: 'Successfully updated app definition',
  resourceWarningTitle: 'Resource warning',
  resourceWarning:
    'The resource definitions in this app definition contain different data from the original. This may cause unexpected results when using older data.',
  preview: 'Preview',
  publish: 'Publish',
  viewLive: 'View live',
  app: 'App',
  coreStyle: 'Core style',
  sharedStyle: 'Shared style',
  cancel: 'Cancel',
  notification: 'You have unsaved changes. Do you wish to continue?',
});
