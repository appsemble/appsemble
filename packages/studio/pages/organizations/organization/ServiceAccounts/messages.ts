import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  title: {
    id: 'studio.pn/gOC',
    defaultMessage: 'Service accounts',
  },
  explanation: {
    id: 'studio.m0jdSV',
    defaultMessage:
      'Service accounts let CI and other non-interactive clients use the API with client credentials. They cannot sign in to the Studio, and single sign-on policies do not apply to them.',
  },
  create: {
    id: 'studio.PKJApf',
    defaultMessage: 'Create service account',
  },
  loadError: {
    id: 'studio.h2G5Ry',
    defaultMessage: 'There was a problem loading the service accounts of this organization.',
  },
  empty: {
    id: 'studio.Mlho1O',
    defaultMessage: 'This organization has no service accounts.',
  },
  role: {
    id: 'studio.1ZgrhW',
    defaultMessage: 'Role',
  },
  revokeTitle: {
    id: 'studio.n63tco',
    defaultMessage: 'Revoke service account',
  },
  revokeBody: {
    id: 'studio.cn0iZ8',
    defaultMessage: 'Clients using this service account lose access immediately.',
  },
});
