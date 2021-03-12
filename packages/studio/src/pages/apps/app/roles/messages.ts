import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  title: 'Roles',
  members: 'Members',
  member: 'Member',
  role: 'Role',
  you: 'It’s you!',
  changeRoleSuccess: 'Successfully changed role of {name} to {role}.',
  changeRoleError: 'Something went wrong when trying to change this member’s role.',
  inviteOrganization:
    'In order to invite more members, they have to be added to the organization first. Click <link>here</link> to invite new members.',
  noMembers: 'This app currently has no members.',
  memberError: 'Something went wrong when trying to load the list of members.',
  loadingMembers: 'Loading members…',
});
