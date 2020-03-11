export const ViewApps = 'ViewApps';
export const ManageRoles = 'ManageRoles';
export const ManageMembers = 'ManageMembers';
export const PublishBlocks = 'PublishBlocks';
export const CreateApps = 'CreateApps';
export const EditApps = 'EditApps';
export const EditAppSettings = 'EditAppSettings';
export const EditThemes = 'EditThemes';
export const DeleteApps = 'DeleteApps';
export const PushNotifications = 'PushNotifications';
export const ManageResources = 'ManageResources';

export const permissions = {
  ViewApps,
  ManageRoles,
  ManageMembers,
  PublishBlocks,
  CreateApps,
  EditApps,
  EditAppSettings,
  EditThemes,
  DeleteApps,
  PushNotifications,
  ManageResources,
} as const;

export type Permission = keyof typeof permissions;
