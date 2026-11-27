import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  testConnection: {
    id: 'studio.q46BGE',
    defaultMessage: 'Test connection',
  },
  tryLogin: {
    id: 'studio.R4mhUU',
    defaultMessage: 'Try login',
  },
  help: {
    id: 'studio.KoCuri',
    defaultMessage:
      'Test the settings of this form, also before saving them. A test login does not log you in to the app.',
  },
  loginPending: {
    id: 'studio.ZQY0J5',
    defaultMessage: 'Log in with the provider in the window that opened.',
  },
  popupBlocked: {
    id: 'studio.uza3F4',
    defaultMessage: 'The login window could not open. Allow pop-ups for Appsemble Studio.',
  },
  requestError: {
    id: 'studio.ynfLx1',
    defaultMessage: 'Something went wrong testing the settings',
  },
  pass: {
    id: 'studio.3NHsqm',
    defaultMessage: 'Passed',
  },
  warn: {
    id: 'studio.3SVI5p',
    defaultMessage: 'Warning',
  },
  fail: {
    id: 'studio.vXCeIi',
    defaultMessage: 'Failed',
  },
  skip: {
    id: 'studio.djZCU5',
    defaultMessage: 'Skipped',
  },
  authorizationUrl: {
    id: 'studio.uiL7XC',
    defaultMessage: 'Authorization URL',
  },
  tokenUrl: {
    id: 'studio.PJhe0H',
    defaultMessage: 'Token URL',
  },
  clientCredentials: {
    id: 'studio.0vWUIJ',
    defaultMessage: 'Client ID and secret',
  },
  userInfoUrl: {
    id: 'studio.oM0YKU',
    defaultMessage: 'User info URL',
  },
  discovery: {
    id: 'studio.Wo2Upv',
    defaultMessage: 'OpenID Connect discovery',
  },
  scope: {
    id: 'studio.nso3Mj',
    defaultMessage: 'Scope',
  },
  reachable: {
    id: 'studio.DL4q4q',
    defaultMessage: 'The server can reach it.',
  },
  httpError: {
    id: 'studio.CQd7SC',
    defaultMessage: 'The provider answered with an error status.',
  },
  blocked: {
    id: 'studio.iKi0HR',
    defaultMessage:
      'The server may not connect to this private address. The operator of Appsemble can allow the host with the ssrfAllowIpAddressList setting.',
  },
  certificate: {
    id: 'studio.jlwXNY',
    defaultMessage:
      'The server does not trust the certificate of the provider. The operator of Appsemble can trust its certificate authority with the trustedCaBundle setting.',
  },
  timeout: {
    id: 'studio.j24kz+',
    defaultMessage: 'The provider did not answer in time.',
  },
  unreachable: {
    id: 'studio.DwjzTU',
    defaultMessage: 'The server can’t connect to it.',
  },
  authorizationUrlWarning: {
    id: 'studio.5Itl+D',
    defaultMessage: 'Browsers of users open this URL, not the server, so they may still reach it.',
  },
  accepted: {
    id: 'studio.FStzjs',
    defaultMessage: 'The provider accepted them.',
  },
  rejected: {
    id: 'studio.7Nrms8',
    defaultMessage: 'The provider rejected the client ID or secret.',
  },
  unexpected: {
    id: 'studio.kJd4o+',
    defaultMessage: 'The provider answered unexpectedly, check its answer.',
  },
  tokenUrlFailed: {
    id: 'studio.plWuqC',
    defaultMessage: 'Not checked, because the token URL failed.',
  },
  notConfigured: {
    id: 'studio.G7Oban',
    defaultMessage: 'Not configured, so a login reads the user from the tokens.',
  },
  match: {
    id: 'studio.TTYOQb',
    defaultMessage: 'The URLs match the discovery document of the provider.',
  },
  mismatch: {
    id: 'studio.SP6Ved',
    defaultMessage: 'The URLs differ from the discovery document of the provider, which lists:',
  },
  notDerivable: {
    id: 'studio.0Cf5nV',
    defaultMessage: 'Not checked, because the issuer can’t be derived from the authorization URL.',
  },
  notFound: {
    id: 'studio.iyuJMS',
    defaultMessage: 'The provider publishes no discovery document.',
  },
  noRoleMappings: {
    id: 'studio.lGxNFc',
    defaultMessage: 'No role mappings are configured.',
  },
  groupsScopeIncluded: {
    id: 'studio.FDGso1',
    defaultMessage: 'The scope requests groups for the role mappings.',
  },
  groupsScopeMissing: {
    id: 'studio.4KnWaU',
    defaultMessage:
      'The role mappings need a groups claim, but the scope does not request groups. Check that the provider adds the claim anyway, for example with a group mapper.',
  },
  providerError: {
    id: 'studio.l1n3Wj',
    defaultMessage: 'The provider returned an error to the login.',
  },
  codeExchangeFailed: {
    id: 'studio.OlX1qk',
    defaultMessage: 'Exchanging the code at the token URL failed.',
  },
  userInfoFailed: {
    id: 'studio.EU0oww',
    defaultMessage: 'Reading the user info failed.',
  },
  noSubject: {
    id: 'studio.Lyxm0Y',
    defaultMessage: 'Neither the tokens nor the user info contain a subject (sub).',
  },
  loggedIn: {
    id: 'studio.FSYe9K',
    defaultMessage: 'The provider identified the user as {sub} with email address {email}.',
  },
  groups: {
    id: 'studio.7cq6o+',
    defaultMessage: 'Groups: {groups}',
  },
  noGroups: {
    id: 'studio.9CMxPK',
    defaultMessage: 'The provider returned no groups.',
  },
  roles: {
    id: 'studio.FVjgHH',
    defaultMessage: 'The role mappings give the user the app roles {roles}.',
  },
  noRoleMatch: {
    id: 'studio.zZZXrh',
    defaultMessage: 'No role matched, so this user can’t log in to the app.',
  },
  defaultRole: {
    id: 'studio./EJWEc',
    defaultMessage:
      'No role mappings are configured, so the user gets the default role of the app.',
  },
  idToken: {
    id: 'studio.AAjLJs',
    defaultMessage: 'ID token claims',
  },
  accessToken: {
    id: 'studio.hqREKZ',
    defaultMessage: 'Access token claims',
  },
  userInfo: {
    id: 'studio.kQYKEz',
    defaultMessage: 'User info response',
  },
  user: {
    id: 'studio.jk+2Zb',
    defaultMessage: 'User as Appsemble reads it',
  },
});
