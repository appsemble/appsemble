import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  title: 'Settings',
  chooseFile: 'Choose file…',
  noFile: 'No file chosen',
  icon: 'Icon',
  iconDescription: 'The icon that will be shown to the user.',
  visibilityLabel: 'Visibility',
  visibilityDescription:
    'Public apps are available in the app store. Unlisted apps aren’t listed publicly, but they are accessible using a direct link. Private apps are only visible to organization members.',
  public: 'Public',
  unlisted: 'Unlisted',
  private: 'Private',
  showAppDefinitionDescription: 'If checked, other people may view the app definition of this app.',
  showAppDefinitionLabel: 'Show app definition',
  appLock: 'App lock',
  lockApp: 'Lock app',
  unlockApp: 'Unlock app',
  lockedDescription:
    'If the app is locked, it is prevented from being updated without unlocking it first.',
  unlockAppDescription: 'Are you sure you want to unlock this app?',
  lockAppDescription: 'Are you sure you want to lock this app?',
  lockedSuccessfully: 'Successfully locked the app.',
  unlockedSuccessfully: 'Successfully unlocked the app.',
  lockError: 'Something went wrong when trying to change the locked status of the app.',
  path: 'Path',
  pathDescription: 'The path used to access the app.',
  domain: 'Domain name',
  domainDescription:
    'The domain name on which this app is available. For more information on how to set this up, please refer to the <link>documentation</link>.',
  domainError: 'This must be a valid domain name without a protocol',
  googleAnalyticsIDLabel: 'Google Analytics ID',
  googleAnalyticsIDDescription:
    'If this is specified, Google analytics will be applied to your app.',
  googleAnalyticsError: 'This needs to be a valid Google Analytics ID',
  saveChanges: 'Save changes',
  updateSuccess: 'Successfully updated settings.',
  updateError: 'Something went wrong when trying to update the settings.',
  deleteSuccess: 'Successfully deleted app {name}',
  delete: 'Delete app',
  deleteHelp: 'Deleting an app cannot be undone.',
  deleteWarningTitle: 'Deleting app',
  deleteWarning: 'Are you sure you want to delete this app? This action cannot be reverted.',
  errorDelete: 'Something went wrong trying to delete this app',
  cancel: 'Cancel',
  dangerZone: 'Dangerous actions',
  longDescription: 'Long description',
  longDescriptionDescription:
    'This field can be used to describe the app in more detail than the app’s description. Supports Markdown syntax.',
  sentryDsnLabel: 'Sentry DSN',
  sentryDsnDescription:
    'If this is specified, Sentry monitoring and error tracking will be applied to your app.',
  sentryEnvironmentLabel: 'Sentry environment',
  sentryEnvironmentDescription:
    'The environment that should be passed to Sentry when using a custom Sentry DSN.',
  sslError: 'There was a problem generating an SSL certificate for this domain',
  sslUnknown: 'The current status of the SSL certificate is unknown',
  sslMissing:
    'The SSL certificate is missing. If this persists, try updating this field an changing it back.',
  sslReady: 'Your app is secured using SSL',
  sslPending:
    'Your SSL certificate is being generated. This may take up to 24 hours, but it’s usually faster.',
  emailNameLabel: 'Email name',
  emailNameDescription:
    'The name displayed for emails sent for this app. The email address won’t change.',
});
