import { Permission } from './Permission.js';

const member = [Permission.ViewApps, Permission.ViewMembers];
const Translator = [...member, Permission.EditAppMessages];
const APIReader = [...member, Permission.ReadAssets, Permission.ReadResources];
const APIUser = [...APIReader, Permission.ManageAssets, Permission.ManageResources];

const AppEditor = [
  ...member,
  Permission.EditApps,
  Permission.EditAppMessages,
  Permission.ManageAssets,
  Permission.ManageResources,
  Permission.PushNotifications,
  Permission.ReadAssets,
  Permission.ReadResources,
];
const Maintainer = [
  ...AppEditor,
  Permission.CreateApps,
  Permission.DeleteApps,
  Permission.EditAppSettings,
  Permission.InviteMember,
  Permission.ManageTeams,
  Permission.PublishBlocks,
];
const Owner = [
  ...Maintainer,
  Permission.EditOrganization,
  Permission.ManageMembers,
  Permission.ManageRoles,
];

export const roles = {
  Member: member,
  Translator,
  APIReader,
  APIUser,
  AppEditor,
  Maintainer,
  Owner,
} as const;

export type Role = keyof typeof roles;

export enum TeamRole {
  Member = 'member',
  Manager = 'manager',
}
