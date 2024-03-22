import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  modalTitle: {
    id: 'studio.RQEFoh',
    defaultMessage: 'OAuth2 Secret',
  },
  nameLabel: {
    id: 'studio.HAlOn1',
    defaultMessage: 'Name',
  },
  nameHelp: {
    id: 'studio.+s1Ayf',
    defaultMessage: 'The name that will be displayed on the login button',
  },
  iconLabel: {
    id: 'studio.kk4TVW',
    defaultMessage: 'Icon',
  },
  iconHelp: {
    id: 'studio.Fb3/VH',
    defaultMessage: 'The FontAwesome icon that will be displayed on the login button',
  },
  redirectUrlLabel: {
    id: 'studio.pn2dEs',
    defaultMessage: 'Redirect URL',
  },
  redirectUrlHelp: {
    id: 'studio.wzYUkW',
    defaultMessage: 'Copy this into the callback URI field of the provider',
  },
  redirectUrlCopySuccess: {
    id: 'studio.LACMuV',
    defaultMessage: 'Redirect URL copied to clipboard',
  },
  redirectUrlCopyError: {
    id: 'studio.HFGX12',
    defaultMessage: 'Failed to copy redirect URL to clipboard',
  },
  authorizationUrlLabel: {
    id: 'studio.uiL7XC',
    defaultMessage: 'Authorization URL',
  },
  authorizationUrlHelp: {
    id: 'studio.k/NtR0',
    defaultMessage: 'The URL where the user will be redirected to confirm their login',
  },
  tokenUrlLabel: {
    id: 'studio.PJhe0H',
    defaultMessage: 'Token URL',
  },
  tokenUrlHelp: {
    id: 'studio.RCees0',
    defaultMessage: 'The URL where Appsemble should request tokens to log in the user',
  },
  clientIdLabel: {
    id: 'studio.U5+MBC',
    defaultMessage: 'Client ID',
  },
  clientIdHelp: {
    id: 'studio./DgTIj',
    defaultMessage: 'An ID which identifies the app to the login provider',
  },
  clientSecretLabel: {
    id: 'studio.B7p2EC',
    defaultMessage: 'Client secret',
  },
  clientSecretHelp: {
    id: 'studio.GMES1s',
    defaultMessage: 'A secret which identifies the app to the login provider',
  },
  scopeLabel: {
    id: 'studio.nso3Mj',
    defaultMessage: 'Scope',
  },
  scopeHelp: {
    id: 'studio.55roIj',
    defaultMessage: 'The scope that is needed to identify the user.',
  },
  userInfoUrlLabel: {
    id: 'studio.oM0YKU',
    defaultMessage: 'User info URL',
  },
  userInfoUrlHelp: {
    id: 'studio.O+/dCY',
    defaultMessage:
      'The URL from which Appsemble should fetch user information.<n></n>Make sure to check with your OAuth2 provider what the correct <info>userinfo</info> endpoint is to use.',
  },
  remapperLabel: {
    id: 'studio.lcRcIO',
    defaultMessage: 'User info remapper',
  },
  remapperHelp: {
    id: 'studio.pc+67A',
    defaultMessage: 'A <link>remapper</link> that is applied on the user info object',
  },
  badUrl: {
    id: 'studio.SHiPSp',
    defaultMessage: 'This must be a valid URL',
  },
  close: {
    id: 'studio.rbrahO',
    defaultMessage: 'Close',
  },
  save: {
    id: 'studio.UC1YWm',
    defaultMessage: 'Save secret',
  },
  deleteWarningTitle: {
    id: 'studio.t4NVlC',
    defaultMessage: 'Deleting secret',
  },
  deleteWarning: {
    id: 'studio.n5Sqbb',
    defaultMessage: 'Are you sure you want to delete this secret? This action cannot be reverted.',
  },
  cancel: {
    id: 'studio.47FYwb',
    defaultMessage: 'Cancel',
  },
  delete: {
    id: 'studio.9uCErh',
    defaultMessage: 'Delete secret',
  },
  deleteSuccess: {
    id: 'studio.ueImzj',
    defaultMessage: 'Successfully deleted secret {name}',
  },
  deleteButton: {
    id: 'studio.9uCErh',
    defaultMessage: 'Delete secret',
  },
});
