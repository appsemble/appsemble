import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  title: 'Authorize {app}',
  invalidClientId: 'Invalid client id {clientId}.',
  missingRedirectUri: 'Missing redirect URI parameter',
  unknownError: 'An unknown error has occurred',
  prompt: 'Allow {app} to perform the following actions on your behalf?',
  notAllowed:
    'Because of the security policy of the app, you currently are not allowed to log into {app}. Please contact the author of the app if you wish to be invited.',
  deny: 'Deny',
  allow: 'Allow',
  readProfile: 'Read your public profile (primary email and display name).',
  manageResource: 'Link your account to the resources created on your behalf.',
  returnToApp: 'Return to app',
});
