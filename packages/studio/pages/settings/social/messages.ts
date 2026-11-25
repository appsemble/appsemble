import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  organizationSso: {
    defaultMessage: 'Organization single sign-on',
    id: 'studio.tPPlF9',
  },
  organization: {
    defaultMessage: 'Organization: {organization} ({provider})',
    id: 'studio.KANIBl',
  },
  issuer: {
    defaultMessage: 'Issuer: {issuer}',
    id: 'studio.1TWviW',
  },
  accountId: {
    defaultMessage: 'Account ID: {subject}',
    id: 'studio.Bx3fEm',
  },
  unlink: {
    defaultMessage: 'Unlink single sign-on',
    id: 'studio.nBSzx3',
  },
  confirmUnlink: {
    defaultMessage:
      'Unlink account {subject} from {issuer}? This revokes your organization single sign-on access, its sessions, and personal CLI credentials created through it.',
    id: 'studio.hd/7zd',
  },
  cancel: {
    defaultMessage: 'Cancel',
    id: 'studio.47FYwb',
  },
  unlinkSuccess: {
    defaultMessage: 'Single sign-on account unlinked.',
    id: 'studio.3oVx73',
  },
  unlinkError: {
    defaultMessage: 'Unable to unlink this single sign-on account. Please try again.',
    id: 'studio.oN/nYp',
  },
  noIdentities: {
    defaultMessage: 'No organization single sign-on accounts are linked.',
    id: 'studio.YoRaAU',
  },
  title: {
    id: 'studio.TUggpX',
    defaultMessage: 'Social login',
  },
  connectAccount: {
    id: 'studio.40zOQn',
    defaultMessage: 'Connect {name} account',
  },
  disconnectAccount: {
    id: 'studio.HzbcJI',
    defaultMessage: 'Disconnect {name} account',
  },
  disconnectError: {
    id: 'studio.Y5XkIv',
    defaultMessage: 'There was a problem disconnecting {name}',
  },
  disconnectSuccess: {
    id: 'studio.1IRjYb',
    defaultMessage: 'Disconnected {name} successfully',
  },
  error: {
    id: 'studio.8OHgiT',
    defaultMessage: 'There was a problem loading your connected accounts. Please try again.',
  },
});
