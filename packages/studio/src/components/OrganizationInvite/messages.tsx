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
  noInvite: 'No invite has been found. You can return to Appsemble {here}.',
  joined: 'joined',
  left: 'left',
});
