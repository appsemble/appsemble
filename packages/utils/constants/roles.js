import {
  CreateApps,
  DeleteApps,
  EditApps,
  EditAppSettings,
  EditThemes,
  ManageMembers,
  ManageResources,
  ManageRoles,
  PublishBlocks,
  PushNotifications,
  ViewApps,
} from './permissions';

const Member = [ViewApps];
const AppEditor = [...Member, EditApps, PushNotifications, ManageResources];
const Maintainer = [
  ...AppEditor,
  EditThemes,
  PublishBlocks,
  CreateApps,
  EditAppSettings,
  DeleteApps,
];
const Owner = [...Maintainer, ManageMembers, ManageRoles];

export default {
  Member,
  AppEditor,
  Maintainer,
  Owner,
};
