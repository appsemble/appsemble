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
