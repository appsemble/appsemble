import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  modalTitle: 'OAuth2 Secret',
  nameLabel: 'Name',
  nameHelp: 'The name that will be displayed on the login button',
  iconLabel: 'Icon',
  iconHelp: 'The FontAwesome icon that will be displayed on the login button',
  redirectUrlLabel: 'Redirect URL',
  redirectUrlHelp: 'Copy this into the callback URI field of the provider',
  redirectUrlCopySuccess: 'Redirect URL copied to clipboard',
  redirectUrlCopyError: 'Failed to copy redirect URL to clipboard',
  authorizationUrlLabel: 'Authorization URL',
  authorizationUrlHelp: 'The URL where the user will be redirected to confirm their login',
  tokenUrlLabel: 'Token URL',
  tokenUrlHelp: 'The URL where Appsemble should request tokens to log in the user',
  clientIdLabel: 'Client ID',
  clientIdHelp: 'An ID which identifies the app to the login provider',
  clientSecretLabel: 'Client secret',
  clientSecretHelp: 'A secret which identifies the app to the login provider',
  scopeLabel: 'Scope',
  scopeHelp: 'The scope that is needed to identify the user.',
  userInfoUrlLabel: 'User info URL',
  userInfoUrlHelp: 'The URL from which Appsemble should fetch user information',
  remapperLabel: 'User info remapper',
  remapperHelp: 'A <link>remapper</link> that is applied on the user info object',
  badUrl: 'This must be a valid URL',
  close: 'Close',
  save: 'Save secret',
});
