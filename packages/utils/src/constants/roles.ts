import Permission from './Permission';

const Member = [Permission.ViewApps];
const AppEditor = [
  ...Member,
  Permission.EditApps,
  Permission.PushNotifications,
  Permission.ManageResources,
];
const Maintainer = [
  ...AppEditor,
  Permission.EditThemes,
  Permission.PublishBlocks,
  Permission.CreateApps,
  Permission.EditAppSettings,
  Permission.DeleteApps,
  Permission.InviteMember,
];
const Owner = [...Maintainer, Permission.ManageMembers, Permission.ManageRoles];

export const roles = {
  Member,
  AppEditor,
  Maintainer,
  Owner,
} as const;

export type Role = keyof typeof roles;
