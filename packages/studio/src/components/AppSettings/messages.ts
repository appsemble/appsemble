import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  title: 'Settings',
  chooseFile: 'Choose file…',
  noFile: 'No file chosen',
  icon: 'Icon',
  iconDescription: 'The icon that will be shown to the user.',
  privateLabel: 'App Visibility',
  private: 'Private',
  privateDescription:
    'If checked, prevent this app from appearing on the app list if the user is not part of this app’s organization.',
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
});
