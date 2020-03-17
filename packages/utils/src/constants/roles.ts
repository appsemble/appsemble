import {
  CreateApps,
  DeleteApps,
  EditApps,
  EditAppSettings,
  EditThemes,
  ManageMembers,
  ManageResources,
  ManageRoles,
  Permission,
  PublishBlocks,
  PushNotifications,
  ViewApps,
} from './permissions';

const Member: Permission[] = [ViewApps];
const AppEditor: Permission[] = [...Member, EditApps, PushNotifications, ManageResources];
const Maintainer: Permission[] = [
  ...AppEditor,
  EditThemes,
  PublishBlocks,
  CreateApps,
  EditAppSettings,
  DeleteApps,
];
const Owner: Permission[] = [...Maintainer, ManageMembers, ManageRoles];

export const roles = {
  Member,
  AppEditor,
  Maintainer,
  Owner,
} as const;

export type Role = keyof typeof roles;
