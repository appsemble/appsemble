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

export const Member = [ViewApps];
export const AppEditor = [...Member, EditApps, PushNotifications];
export const Maintainer = [
  ...Member,
  ...AppEditor,
  EditThemes,
  ManageResources,
  PublishBlocks,
  CreateApps,
  EditAppSettings,
  DeleteApps,
];
export const Owner = [...Maintainer, ManageMembers, ManageRoles];

// eslint-disable-next-line no-unused-vars
export async function checkRole(ctx, organizationId, permissions) {
  // XXX: Replace with Koas function
  // Step 1: Fetch user from DB
  // Step 2: Fetch their role
  // Step 3: Map role to one of above roles
  // Step 4: Check if role contains permission
  // If true: resolve
  // If false: reject with Forbidden
  return new Promise(resolve => resolve());
}
