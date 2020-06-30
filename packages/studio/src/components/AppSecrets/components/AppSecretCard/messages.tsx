import { defineMessages } from 'react-intl';

export default defineMessages({
  nameLabel: 'Name',
  nameHelp: 'The name that will be displayed on the login button',
  iconLabel: 'Icon',
  iconHelp: 'The Fontawesome icon that will be displayed on the login button',
  authorizationUrlLabel: 'Authorization URL',
  authorizationUrlHelp: 'The URL where the user will be redirected to confirm their login',
  tokenUrlLabel: 'Token URL',
  tokenUrlHelp: 'The URL where Appsemble should request tokens to log in the user',
  userInfoUrlHelp: 'The URL from which Appsemble should fetch user information.',
  userInfoUrlLabel: 'User info URL',
  clientIdLabel: 'Client ID',
  clientIdHelp: 'An ID which identifies the app to the login provider',
  clientSecretLabel: 'Client secret',
  clientSecretHelp: 'A secret which identifies the app to the login provider',
  scopeLabel: 'Scope',
  scopeHelp: 'The scope that is needed to identify the user.',
  badUrl: 'This mustbe a valid URL',
  save: 'Save secret',
});
