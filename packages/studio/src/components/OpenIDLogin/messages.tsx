import { defineMessages } from 'react-intl';

export default defineMessages({
  title: 'Authorize {app}',
  invalidClientId: 'Invalid client id {clientId}.',
  missingRedirectUri: 'Missing redirect URI parameter',
  unknownError: 'An unknown error has occurred',
  prompt: 'Allow {app} to perform the following actions on your behalf?',
  deny: 'Deny',
  allow: 'Allow',
  readProfile: 'Read your public profile (primary email and display name).',
  manageResource: 'Link your account to the resources created on your behalf.',
});
