import { Permission } from './Permission';

const member = [Permission.ViewApps];
const AppEditor = [
  ...member,
  Permission.EditApps,
  Permission.PushNotifications,
  Permission.ManageResources,
  Permission.EditAppMessages,
];
const Maintainer = [
  ...AppEditor,
  Permission.PublishBlocks,
  Permission.CreateApps,
  Permission.EditAppSettings,
  Permission.DeleteApps,
  Permission.InviteMember,
  Permission.ManageTeams,
];
const Owner = [
  ...Maintainer,
  Permission.EditOrganization,
  Permission.ManageMembers,
  Permission.ManageRoles,
];

export const roles = {
  Member: member,
  AppEditor,
  Maintainer,
  Owner,
} as const;

export type Role = keyof typeof roles;

export enum TeamRole {
  Member = 'member',
  Manager = 'manager',
}
