import { defineMessages } from 'react-intl';

export default defineMessages({
  joining: 'Joining {organization}',
  organizationLabel: 'Organization',
  invitePrompt: 'Would you like to join this organization?',
  accept: 'Accept',
  decline: 'Decline',
  invalidInvite: 'This invite is invalid. This may be caused by the invitation being retracted.',
  invalidOrganization: 'The organization does not match up with the invite token.',
  error: 'Something went wrong when trying to respond to this invitation.',
  appSettings: 'apps settings',
  organizationSettings: 'organization settings',
  successJoined:
    'Successfully joined {organization}. You can start making apps in the {makeApps} or view your organization in the {viewOrganization}.',
  successDeclined: 'Successfully declined the invitation. You can go back to Appsemble {makeApps}.',
  here: 'here',
  noInvite:
    'No invite has been found. It may have been used or revoked. You can return to Appsemble {here}.',
  joined: 'joined',
  left: 'left',
  alreadyJoined:
    'You are already part of the organization. If you wish to accept this invitation, please log into a different account.',
  logout: 'Logout',
  login: 'Login',
  loginPrompt: 'Please log into an existing account or create one to join this organization.',
});
