import { AppPermission, OrganizationPermission } from './permissions.js';

const OrganizationMember = [
  OrganizationPermission.QueryApps,
  OrganizationPermission.QueryOrganizationMembers,
];

const OrganizationAppTranslator = [
  ...OrganizationMember,
  OrganizationPermission.QueryAppMessages,
  OrganizationPermission.CreateAppMessages,
  OrganizationPermission.UpdateAppMessages,
  OrganizationPermission.DeleteAppMessages,
];

const OrganizationAppContentsExplorer = [
  ...OrganizationMember,
  OrganizationPermission.QueryAppAssets,
  OrganizationPermission.QueryAppResources,
  OrganizationPermission.GetAppResources,
];

const OrganizationAppContentsManager = [
  ...OrganizationAppContentsExplorer,
  OrganizationPermission.CreateAppAssets,
  OrganizationPermission.UpdateAppAssets,
  OrganizationPermission.DeleteAppAssets,
  OrganizationPermission.CreateAppResources,
  OrganizationPermission.UpdateAppResources,
  OrganizationPermission.PatchAppResources,
  OrganizationPermission.DeleteAppResources,
];

const OrganizationAppMemberManager = [
  OrganizationPermission.CreateAppInvites,
  OrganizationPermission.QueryAppInvites,
  OrganizationPermission.QueryAppMembers,
  OrganizationPermission.PatchAppMembers,
  OrganizationPermission.RemoveAppMembers,
];

const OrganizationAppGroupManager = [
  OrganizationPermission.QueryGroups,
  OrganizationPermission.CreateGroups,
  OrganizationPermission.UpdateGroups,
  OrganizationPermission.DeleteGroups,
];

const OrganizationAppGroupMembersManager = [
  OrganizationPermission.CreateGroupInvites,
  OrganizationPermission.QueryGroupMembers,
  OrganizationPermission.RemoveGroupMembers,
];

const OrganizationAppManager = [
  ...OrganizationAppTranslator,
  ...OrganizationAppContentsManager,
  ...OrganizationAppMemberManager,
  ...OrganizationAppGroupManager,
  ...OrganizationAppGroupMembersManager,
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

const OrganizationAppCollectionManager = [
  ...OrganizationMember,
  OrganizationPermission.CreateAppCollections,
  OrganizationPermission.UpdateAppCollections,
  OrganizationPermission.DeleteAppCollections,
];

const OrganizationBlockManager = [
  ...OrganizationMember,
  OrganizationPermission.PublishBlocks,
  OrganizationPermission.DeleteBlocks,
];

const OrganizationTrainingManager = [
  ...OrganizationMember,
  OrganizationPermission.CreateTrainings,
  OrganizationPermission.UpdateTrainings,
  OrganizationPermission.DeleteTrainings,
  OrganizationPermission.CreateTrainingBlocks,
  OrganizationPermission.UpdateTrainingBlocks,
  OrganizationPermission.DeleteTrainingBlocks,
];

const OrganizationMaintainer = [
  ...OrganizationAppManager,
  ...OrganizationAppCollectionManager,
  ...OrganizationBlockManager,
  ...OrganizationTrainingManager,
  OrganizationPermission.CreateApps,
  OrganizationPermission.DeleteApps,
  OrganizationPermission.CreateOrganizationInvites,
  OrganizationPermission.QueryOrganizationInvites,
  OrganizationPermission.UpdateOrganizationInvites,
  OrganizationPermission.DeleteOrganizationInvites,
];

const OrganizationOwner = [
  ...OrganizationMaintainer,
  OrganizationPermission.UpdateOrganizations,
  OrganizationPermission.DeleteOrganizations,
  OrganizationPermission.UpdateOrganizationMembers,
  OrganizationPermission.RemoveOrganizationMembers,
];

export const organizationMemberRoles = {
  Member: OrganizationMember,
  AppTranslator: OrganizationAppTranslator,
  AppContentsExplorer: OrganizationAppContentsExplorer,
  AppContentsManager: OrganizationAppContentsManager,
  AppMemberManager: OrganizationAppMemberManager,
  AppGroupManager: OrganizationAppGroupManager,
  AppGroupMembersManager: OrganizationAppGroupMembersManager,
  AppManager: OrganizationAppManager,
  AppCollectionManager: OrganizationAppCollectionManager,
  BlockManager: OrganizationBlockManager,
  Maintainer: OrganizationMaintainer,
  Owner: OrganizationOwner,
};

export type OrganizationMemberRole = keyof typeof organizationMemberRoles;

const AppMember: AppPermission[] = [];

const AppMembersManager = [
  ...AppMember,
  AppPermission.CreateAppInvites,
  AppPermission.QueryAppMembers,
  AppPermission.RemoveAppMembers,
];

const AppGroupsManager = [
  ...AppMember,
  AppPermission.QueryGroups,
  AppPermission.CreateGroups,
  AppPermission.UpdateGroups,
  AppPermission.DeleteGroups,
];

const AppGroupsMembersManager = [
  ...AppMember,
  AppPermission.CreateGroupInvites,
  AppPermission.QueryGroupMembers,
  AppPermission.RemoveGroupMembers,
];

const AppResourcesManager = [
  ...AppMember,
  AppPermission.CreateResources,
  AppPermission.QueryResources,
  AppPermission.GetResources,
  AppPermission.UpdateResources,
  AppPermission.PatchResources,
  AppPermission.DeleteResources,
];

const AppOwner = [...AppMember, ...AppMembersManager, ...AppGroupsManager, ...AppResourcesManager];

export const appMemberRoles = {
  Member: AppMember,
  MembersManager: AppMembersManager,
  GroupsManager: AppGroupsManager,
  GroupMembersManager: AppGroupsMembersManager,
  ResourcesManager: AppResourcesManager,
  Owner: AppOwner,
};

export type AppMemberRole = string | keyof typeof appMemberRoles;
