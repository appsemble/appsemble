import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  title: {
    id: 'studio.6jyoQa',
    defaultMessage: 'Authorize {app}',
  },
  invalidClientId: {
    id: 'studio.ohf9WS',
    defaultMessage: 'Invalid client id {clientId}.',
  },
  missingRedirectUri: {
    id: 'studio.KQc7BF',
    defaultMessage: 'Missing redirect URI parameter',
  },
  unknownError: {
    id: 'studio.UZEPLR',
    defaultMessage: 'An unknown error has occurred',
  },
  prompt: {
    id: 'studio.zji8KM',
    defaultMessage: 'Allow {app} to perform the following actions on your behalf?',
  },
  notAllowed: {
    id: 'studio.gR8dZ5',
    defaultMessage:
      'Because of the security policy of the app, you currently are not allowed to log into {app}. Please contact the author of the app if you wish to be invited.',
  },
  deny: {
    id: 'studio.htvX+Z',
    defaultMessage: 'Deny',
  },
  allow: {
    id: 'studio.y/bmsG',
    defaultMessage: 'Allow',
  },
  readProfile: {
    id: 'studio.Y8DgqT',
    defaultMessage: 'Read your public profile (primary email and display name).',
  },
  manageResource: {
    id: 'studio.KdrC46',
    defaultMessage: 'Link your account to the resources created on your behalf.',
  },
  returnToApp: {
    id: 'studio.SDua+Y',
    defaultMessage: 'Return to app',
  },
});
