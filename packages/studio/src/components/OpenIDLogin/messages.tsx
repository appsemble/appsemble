import { defineMessages } from 'react-intl';

export default defineMessages({
  title: 'Authorize {app}',
  invalidResponseType: 'Invalid response type {responseType}.',
  missingResponseType: 'Missing response type parameter.',
  invalidScope: 'Invalid scope {scope}.',
  missingScope: 'Missing response scope parameter.',
  invalidClientId: 'Invalid client id {clientId}.',
  missingClientId: 'Missing client id parameter.',
  invalidRedirectUri: 'Invalid redirect URI {redirectUri}.',
  missingRedirectUri: 'Missing redirect URI parameter',
  unknownError: 'An unknown error has occurred',
  prompt: 'Allow {app} to perform the following actions on your behalf?',
  deny: 'Deny',
  allow: 'Allow',
  readProfile: 'Read your public profile (email and display name).',
  manageResource: 'Manage its resource “{resource}” on your behalf.',
});
