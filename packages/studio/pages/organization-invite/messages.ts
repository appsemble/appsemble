import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  joining: {
    id: 'studio.6rt94z',
    defaultMessage: 'Joining {organization}',
  },
  invitePrompt: {
    id: 'studio.+SyiD1',
    defaultMessage: 'Would you like to join this organization?',
  },
  accept: {
    id: 'studio.sjzLbX',
    defaultMessage: 'Accept',
  },
  decline: {
    id: 'studio.pvtgR2',
    defaultMessage: 'Decline',
  },
  deletedOrganization: {
    id: 'studio.c99XhT',
    defaultMessage:
      'The organization you are trying to join could not be found. The organization might have been removed, if not, try again later.',
  },
  invalidInvite: {
    id: 'studio.X8zYDn',
    defaultMessage: 'This invite is invalid. This may be caused by the invitation being retracted.',
  },
  invalidOrganization: {
    id: 'studio.E7OHdE',
    defaultMessage: 'The organization does not match up with the invite token.',
  },
  error: {
    id: 'studio.jUnXQ0',
    defaultMessage: 'Something went wrong when trying to respond to this invitation.',
  },
  successJoined: {
    id: 'studio.6yXGtW',
    defaultMessage:
      'Successfully joined {organization}. You can start making apps in the <makeApps>studio</makeApps> or view your organization in the <viewOrganization>organization settings</viewOrganization>.',
  },
  successDeclined: {
    id: 'studio.VN/45p',
    defaultMessage:
      'Successfully declined the invitation. You can go back to Appsemble <makeApps>here</makeApps>.',
  },
  noInvite: {
    id: 'studio.aNgs41',
    defaultMessage:
      'No invite has been found. It may have been used or revoked. You might want to create an account first. If you already have another account, try logging into that as the invite might have been directed at another user. You can return to Appsemble <link>here</link>.',
  },
  alreadyJoined: {
    id: 'studio.1utknZ',
    defaultMessage:
      'You are already part of the organization. If you wish to accept this invitation, please log into a different account.',
  },
  logout: {
    id: 'studio.C81/uG',
    defaultMessage: 'Logout',
  },
  login: {
    id: 'studio.AyGauy',
    defaultMessage: 'Login',
  },
  loginPrompt: {
    id: 'studio.Vthwhv',
    defaultMessage:
      'Please log into an existing account or create one to respond to this invitation.',
  },
});
