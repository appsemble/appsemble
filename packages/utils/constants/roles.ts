import { Permission } from './Permission.js';

const member = [Permission.ViewApps, Permission.ViewMembers];
const Translator = [...member, Permission.EditAppMessages];
const APIReader = [...member, Permission.ReadAssets, Permission.ReadResources];
const APIUser = [...APIReader, Permission.ManageAssets, Permission.ManageResources];
const AccountManager = [
  Permission.CreateAppAccounts,
  Permission.ReadAppAccounts,
  Permission.DeleteAppAccounts,
  Permission.EditAppAccounts,
];

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
  ...AccountManager,
  Permission.CreateApps,
  Permission.DeleteApps,
  Permission.EditAppSettings,
  Permission.InviteMember,
  Permission.ManageTeams,
  Permission.PublishBlocks,
  Permission.DeleteBlocks,
  Permission.CreateCollections,
  Permission.DeleteCollections,
  Permission.EditCollections,
];
const Owner = [
  ...Maintainer,
  Permission.EditOrganization,
  Permission.DeleteOrganization,
  Permission.ManageMembers,
  Permission.ManageRoles,
];

export const roles = {
  Member: member,
  Translator,
  APIReader,
  APIUser,
  AppEditor,
  Owner,
  Maintainer,
  AccountManager,
} as const;

export type Role = keyof typeof roles;

export enum TeamRole {
  Member = 'member',
  Manager = 'manager',
}
