import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  title: {
    id: 'studio.D3idYv',
    defaultMessage: 'Settings',
  },
  chooseFile: {
    id: 'studio.86RD6b',
    defaultMessage: 'Choose file…',
  },
  noFile: {
    id: 'studio.FTFqXw',
    defaultMessage: 'No file chosen',
  },
  icon: {
    id: 'studio.kk4TVW',
    defaultMessage: 'Icon',
  },
  iconDescription: {
    id: 'studio.oBKJPq',
    defaultMessage: 'The icon that will be shown to the user.',
  },
  visibilityLabel: {
    id: 'studio.JAkIqb',
    defaultMessage: 'Visibility',
  },
  visibilityDescription: {
    id: 'studio.JMlZGy',
    defaultMessage:
      'Public apps are available in the app store. Unlisted apps aren’t listed publicly, but they are accessible using a direct link. Private apps are only visible to organization members.',
  },
  public: {
    id: 'studio.uhu5aG',
    defaultMessage: 'Public',
  },
  unlisted: {
    id: 'studio.HalL+U',
    defaultMessage: 'Unlisted',
  },
  private: {
    id: 'studio.viXE32',
    defaultMessage: 'Private',
  },
  showAppDefinitionDescription: {
    id: 'studio.wzfH0V',
    defaultMessage: 'If checked, other people may view the app definition of this app.',
  },
  showAppDefinitionLabel: {
    id: 'studio.FhSRwt',
    defaultMessage: 'Show app definition',
  },
  appLock: {
    id: 'studio.5JnqzW',
    defaultMessage: 'App lock',
  },
  lockApp: {
    id: 'studio.25qIuX',
    defaultMessage: 'Lock app',
  },
  unlockApp: {
    id: 'studio.9G7vKh',
    defaultMessage: 'Unlock app',
  },
  lockedDescription: {
    id: 'studio.GZdAif',
    defaultMessage:
      'If the app is locked, it is prevented from being updated without unlocking it first.',
  },
  unlockAppDescription: {
    id: 'studio.FDU4xh',
    defaultMessage: 'Are you sure you want to unlock this app?',
  },
  lockAppDescription: {
    id: 'studio.jylA9m',
    defaultMessage: 'Are you sure you want to lock this app?',
  },
  lockedSuccessfully: {
    id: 'studio.3dXAUe',
    defaultMessage: 'Successfully locked the app.',
  },
  unlockedSuccessfully: {
    id: 'studio.Z7LWEB',
    defaultMessage: 'Successfully unlocked the app.',
  },
  lockError: {
    id: 'studio.KPt+Jz',
    defaultMessage: 'Something went wrong when trying to change the locked status of the app.',
  },
  path: {
    id: 'studio.Qp1beM',
    defaultMessage: 'Path',
  },
  pathDescription: {
    id: 'studio.DAlJcD',
    defaultMessage: 'The path used to access the app.',
  },
  domain: {
    id: 'studio.bC8rRP',
    defaultMessage: 'Domain name',
  },
  domainDescription: {
    id: 'studio.1P2stX',
    defaultMessage:
      'The domain name on which this app is available. For more information on how to set this up, please refer to the <link>documentation</link>.',
  },
  domainError: {
    id: 'studio.9Jktf3',
    defaultMessage: 'This must be a valid domain name without a protocol',
  },
  googleAnalyticsIDLabel: {
    id: 'studio.ZwFww6',
    defaultMessage: 'Google Analytics ID',
  },
  googleAnalyticsIDDescription: {
    id: 'studio.w6wF5r',
    defaultMessage:
      'If this is specified, Google analytics will be applied to your app. For more information, please refer to the <link>documentation</link>.',
  },
  googleAnalyticsError: {
    id: 'studio.slZvEA',
    defaultMessage: 'This needs to be a valid Google Analytics ID',
  },
  metaPixelIDLabel: {
    id: 'studio.y7GjxX',
    defaultMessage: 'Meta Pixel ID',
  },
  metaPixelIDDescription: {
    id: 'studio.//39+D',
    defaultMessage:
      'If this is specified, Meta Pixel will be applied to your app. For more information, please refer to the <link>documentation</link>.',
  },
  metaPixelError: {
    id: 'studio.TGLI74',
    defaultMessage: 'This needs to be a valid Meta Pixel ID',
  },
  msClarityIDLabel: {
    id: 'studio.ZUMv1d',
    defaultMessage: 'MS Clarity Project ID',
  },
  msClarityIDDescription: {
    id: 'studio.u4ctdO',
    defaultMessage:
      'If this is specified, MS Clarity will be applied to your app. For more information, please refer to the <link>documentation</link>.',
  },
  msClarityError: {
    id: 'studio.4e71es',
    defaultMessage: 'This needs to be a valid MS Clarity Project ID',
  },
  saveChanges: {
    id: 'studio.X0ha1a',
    defaultMessage: 'Save changes',
  },
  updateSuccess: {
    id: 'studio.906mKa',
    defaultMessage: 'Successfully updated settings.',
  },
  updateError: {
    id: 'studio.iCOmfv',
    defaultMessage: 'Something went wrong when trying to update the settings.',
  },
  updateFailAppLimit: {
    id: 'studio.07b/vz',
    defaultMessage:
      'Update failed due to reaching the limit for publishing apps please upgrade your subscription or delist another app.',
  },
  deleteSuccess: {
    id: 'studio.IJ+Fig',
    defaultMessage: 'Successfully deleted app {name}',
  },
  delete: {
    id: 'studio.3I6uVw',
    defaultMessage: 'Delete app',
  },
  deleteHelp: {
    id: 'studio.V2zuAg',
    defaultMessage: 'Deleting an app cannot be undone.',
  },
  deleteWarningTitle: {
    id: 'studio.2r064T',
    defaultMessage: 'Deleting app',
  },
  deleteWarning: {
    id: 'studio.NWBNwU',
    defaultMessage: 'Are you sure you want to delete this app? This action cannot be reverted.',
  },
  errorDelete: {
    id: 'studio.RglIKq',
    defaultMessage: 'Something went wrong trying to delete this app',
  },
  cancel: {
    id: 'studio.47FYwb',
    defaultMessage: 'Cancel',
  },
  dangerZone: {
    id: 'studio.1fFBqQ',
    defaultMessage: 'Dangerous actions',
  },
  longDescription: {
    id: 'studio.LP673Z',
    defaultMessage: 'Long description',
  },
  longDescriptionDescription: {
    id: 'studio.otg9XH',
    defaultMessage:
      'This field can be used to describe the app in more detail than the app’s description. Supports Markdown syntax.',
  },
  sentryDsnLabel: {
    id: 'studio.fqTGpE',
    defaultMessage: 'Sentry DSN',
  },
  sentryDsnDescription: {
    id: 'studio.axkCem',
    defaultMessage:
      'If this is specified, Sentry monitoring and error tracking will be applied to your app.',
  },
  sentryEnvironmentLabel: {
    id: 'studio.XD8sl2',
    defaultMessage: 'Sentry environment',
  },
  sentryEnvironmentDescription: {
    id: 'studio.MkELgR',
    defaultMessage:
      'The environment that should be passed to Sentry when using a custom Sentry DSN.',
  },
  sslError: {
    id: 'studio.0gbG2D',
    defaultMessage: 'There was a problem generating an SSL certificate for this domain',
  },
  sslUnknown: {
    id: 'studio.XpziH6',
    defaultMessage: 'The current status of the SSL certificate is unknown',
  },
  sslMissing: {
    id: 'studio.ssWhHg',
    defaultMessage:
      'The SSL certificate is missing. If this persists, try updating this field an changing it back.',
  },
  sslReady: {
    id: 'studio.OO/TkO',
    defaultMessage: 'Your app is secured using SSL',
  },
  sslPending: {
    id: 'studio.oBSs4o',
    defaultMessage:
      'Your SSL certificate is being generated. This may take up to 24 hours, but it’s usually faster.',
  },
  emailNameLabel: {
    id: 'studio.25w127',
    defaultMessage: 'Email name',
  },
  emailNameDescription: {
    id: 'studio.Nxyyqc',
    defaultMessage:
      'The name displayed for emails sent for this app. The email address won’t change.',
  },
  displayAppMemberNameLabel: {
    id: 'studio.xWGGQF',
    defaultMessage: 'Display App Member Name',
  },
  displayAppMemberNameDescription: {
    id: 'studio.ipo4aU',
    defaultMessage:
      "Whether to display the logged in app member's name in the title bar, if the name is not available email is displayed",
  },
  displayInstallationPromptLabel: {
    id: 'studio.rQb2kK',
    defaultMessage: 'Prompt App Install',
  },
  displayInstallationPromptDescription: {
    id: 'studio.L5Cie6',
    defaultMessage: 'Whether to display installation prompts to the users of the app',
  },
  skipGroupInvitesLabel: {
    id: 'studio.vIs3fn',
    defaultMessage: 'Skip Group Invites',
  },
  skipGroupInvitesDescription: {
    id: 'studio.UGq/Er',
    defaultMessage: 'Whether to skip sending group invite emails and add group members directly',
  },
  supportedLanguages: {
    id: 'studio.KLr1Qo',
    defaultMessage: 'Supported Languages',
  },
  supportedLanguagesHelp: {
    id: 'studio.q+JBOt',
    defaultMessage: 'Languages officially supported by the app',
  },
});
