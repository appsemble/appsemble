const ViewApps = 'ViewApps';
const ManageRoles = 'ManageRoles';
const ManageMembers = 'ManageMembers';
const PublishBlocks = 'PublishBlocks';
const CreateApps = 'CreateApps';
const EditApps = 'EditApps';
const EditAppSettings = 'EditAppSettings';
const EditThemes = 'EditThemes';
const DeleteApps = 'DeleteApps';
const PushNotifications = 'PushNotifications';
const ManageResources = 'ManageResources';

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
};

const Member = [ViewApps];
const AppEditor = [...Member, EditApps, PushNotifications];
const Maintainer = [
  ...Member,
  ...AppEditor,
  EditThemes,
  ManageResources,
  PublishBlocks,
  CreateApps,
  EditAppSettings,
  DeleteApps,
];
const Owner = [...Maintainer, ManageMembers, ManageRoles];

export const roles = {
  Member,
  AppEditor,
  Maintainer,
  Owner,
};

// eslint-disable-next-line no-unused-vars
export async function checkRole(ctx, organizationId, permission) {
  // XXX: Replace with Koas function
  // Step 1: Fetch user from DB
  // Step 2: Fetch their role
  // Step 3: Map role to one of above roles
  // Step 4: Check if role contains permission
  // If true: resolve
  // If false: reject with Forbidden
  return new Promise(resolve => resolve());
}
