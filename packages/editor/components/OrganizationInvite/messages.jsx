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
  successJoined:
    'Successfully joined {organization}. You can start making apps {makeApps} or view your organization {viewOrganization}.',
  successDeclined: 'Successfully declined the invitation. You can go back to Appsemble {makeApps}.',
  here: 'here',
  noInvite: 'No invite has been found. You can return to Appsemble {here}.',
  joined: 'joined',
  left: 'left',
});
