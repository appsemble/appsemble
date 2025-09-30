import { OrganizationPermission } from './permissions.js';

const OrganizationMemberPermissions = [
  OrganizationPermission.QueryApps,
  OrganizationPermission.QueryOrganizationMembers,
  OrganizationPermission.QueryOrganizationSubscriptions,
];

const OrganizationAppTranslatorPermissions = [
  ...OrganizationMemberPermissions,
  OrganizationPermission.QueryAppMessages,
  OrganizationPermission.CreateAppMessages,
  OrganizationPermission.UpdateAppMessages,
  OrganizationPermission.DeleteAppMessages,
];

const OrganizationAppContentsExplorerPermissions = [
  ...OrganizationMemberPermissions,
  OrganizationPermission.QueryAppAssets,
  OrganizationPermission.QueryAppResources,
  OrganizationPermission.GetAppResources,
];

const OrganizationAppContentsManagerPermissions = [
  ...OrganizationAppContentsExplorerPermissions,
  OrganizationPermission.CreateAppAssets,
  OrganizationPermission.UpdateAppAssets,
  OrganizationPermission.DeleteAppAssets,
  OrganizationPermission.CreateAppResources,
  OrganizationPermission.UpdateAppResources,
  OrganizationPermission.PatchAppResources,
  OrganizationPermission.DeleteAppResources,
];

const OrganizationAppMemberManagerPermissions = [
  OrganizationPermission.CreateAppInvites,
  OrganizationPermission.QueryAppInvites,
  OrganizationPermission.DeleteAppInvites,
  OrganizationPermission.QueryAppMembers,
  OrganizationPermission.DeleteAppMembers,
  OrganizationPermission.UpdateAppMemberRoles,
  OrganizationPermission.PatchAppMemberProperties,
];

const OrganizationAppGroupMembersManagerPermissions = [
  OrganizationPermission.CreateGroupInvites,
  OrganizationPermission.QueryGroupInvites,
  OrganizationPermission.DeleteGroupInvites,
  OrganizationPermission.QueryGroupMembers,
  OrganizationPermission.RemoveGroupMembers,
  OrganizationPermission.UpdateGroupMemberRoles,
];

const OrganizationAppGroupManagerPermissions = [
  ...OrganizationAppGroupMembersManagerPermissions,
  OrganizationPermission.QueryGroups,
  OrganizationPermission.CreateGroups,
  OrganizationPermission.UpdateGroups,
  OrganizationPermission.DeleteGroups,
];

const OrganizationAppManagerPermissions = [
  ...OrganizationAppTranslatorPermissions,
  ...OrganizationAppContentsManagerPermissions,
  ...OrganizationAppMemberManagerPermissions,
  ...OrganizationAppGroupManagerPermissions,
  ...OrganizationAppGroupMembersManagerPermissions,
  OrganizationPermission.UpdateApps,
  OrganizationPermission.ReadAppSettings,
  OrganizationPermission.UpdateAppSettings,
  OrganizationPermission.CreateAppScreenshots,
  OrganizationPermission.DeleteAppScreenshots,
  OrganizationPermission.CreateAppReadmes,
  OrganizationPermission.DeleteAppReadmes,
  OrganizationPermission.CreateAppSecrets,
  OrganizationPermission.QueryAppSecrets,
  OrganizationPermission.UpdateAppSecrets,
  OrganizationPermission.DeleteAppSecrets,
  OrganizationPermission.QueryAppVariables,
  OrganizationPermission.CreateAppVariables,
  OrganizationPermission.UpdateAppVariables,
  OrganizationPermission.DeleteAppVariables,
  OrganizationPermission.PushAppNotifications,
  OrganizationPermission.QueryAppSnapshots,
];

const OrganizationAppCollectionManagerPermissions = [
  ...OrganizationMemberPermissions,
  OrganizationPermission.CreateAppCollections,
  OrganizationPermission.UpdateAppCollections,
  OrganizationPermission.DeleteAppCollections,
];

const OrganizationBlockManagerPermissions = [
  ...OrganizationMemberPermissions,
  OrganizationPermission.PublishBlocks,
  OrganizationPermission.DeleteBlocks,
];

const OrganizationMaintainerPermissions = [
  ...OrganizationAppManagerPermissions,
  ...OrganizationAppCollectionManagerPermissions,
  ...OrganizationBlockManagerPermissions,
  OrganizationPermission.CreateApps,
  OrganizationPermission.DeleteApps,
  OrganizationPermission.CreateOrganizationInvites,
  OrganizationPermission.QueryOrganizationInvites,
  OrganizationPermission.UpdateOrganizationInvites,
  OrganizationPermission.DeleteOrganizationInvites,
];

const OrganizationOwnerPermissions = [
  ...OrganizationMaintainerPermissions,
  OrganizationPermission.UpdateOrganizations,
  OrganizationPermission.DeleteOrganizations,
  OrganizationPermission.RemoveOrganizationMembers,
  OrganizationPermission.UpdateOrganizationMemberRoles,
  OrganizationPermission.ManageOrganizationSubscriptions,
];

export enum PredefinedOrganizationRole {
  Member = 'Member',
  AppTranslator = 'AppTranslator',
  AppContentsExplorer = 'AppContentsExplorer',
  AppContentsManager = 'AppContentsManager',
  AppMemberManager = 'AppMemberManager',
  AppGroupManager = 'AppGroupManager',
  AppGroupMembersManager = 'AppGroupMembersManager',
  AppManager = 'AppManager',
  AppCollectionManager = 'AppCollectionManager',
  BlockManager = 'BlockManager',
  Maintainer = 'Maintainer',
  Owner = 'Owner',
}

export const predefinedOrganizationRolePermissions = {
  [PredefinedOrganizationRole.Member]: OrganizationMemberPermissions,
  [PredefinedOrganizationRole.AppTranslator]: OrganizationAppTranslatorPermissions,
  [PredefinedOrganizationRole.AppContentsExplorer]: OrganizationAppContentsExplorerPermissions,
  [PredefinedOrganizationRole.AppContentsManager]: OrganizationAppContentsManagerPermissions,
  [PredefinedOrganizationRole.AppMemberManager]: OrganizationAppMemberManagerPermissions,
  [PredefinedOrganizationRole.AppGroupManager]: OrganizationAppGroupManagerPermissions,
  [PredefinedOrganizationRole.AppGroupMembersManager]:
    OrganizationAppGroupMembersManagerPermissions,
  [PredefinedOrganizationRole.AppManager]: OrganizationAppManagerPermissions,
  [PredefinedOrganizationRole.AppCollectionManager]: OrganizationAppCollectionManagerPermissions,
  [PredefinedOrganizationRole.BlockManager]: OrganizationBlockManagerPermissions,
  [PredefinedOrganizationRole.Maintainer]: OrganizationMaintainerPermissions,
  [PredefinedOrganizationRole.Owner]: OrganizationOwnerPermissions,
};

export const predefinedOrganizationRoles: PredefinedOrganizationRole[] = Object.values(
  PredefinedOrganizationRole,
);
