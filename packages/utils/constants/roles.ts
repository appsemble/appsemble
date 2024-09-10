import { MainPermission } from './permissions.js';

const OrganizationMember = [MainPermission.QueryApps, MainPermission.QueryOrganizationMembers];

const OrganizationAppTranslator = [
  ...OrganizationMember,
  MainPermission.CreateAppMessages,
  MainPermission.UpdateAppMessages,
  MainPermission.DeleteAppMessages,
];

const OrganizationAppContentsExplorer = [
  ...OrganizationMember,
  MainPermission.QueryAppAssets,
  MainPermission.QueryAppResources,
];

const OrganizationAppContentsManager = [
  ...OrganizationAppContentsExplorer,
  MainPermission.CreateAppAssets,
  MainPermission.UpdateAppAssets,
  MainPermission.DeleteAppAssets,
  MainPermission.CreateAppResources,
  MainPermission.UpdateAppResources,
  MainPermission.DeleteAppResources,
];

const OrganizationAppManager = [
  ...OrganizationAppTranslator,
  ...OrganizationAppContentsManager,
  MainPermission.UpdateApps,
  MainPermission.ReadAppSettings,
  MainPermission.UpdateAppSettings,
  MainPermission.CreateAppScreenshots,
  MainPermission.DeleteAppScreenshots,
  MainPermission.CreateAppSecrets,
  MainPermission.QueryAppSecrets,
  MainPermission.UpdateAppSecrets,
  MainPermission.DeleteAppSecrets,
  MainPermission.PushAppNotifications,
];

const OrganizationAppTeamManager = [
  ...OrganizationMember,
  MainPermission.CreateAppTeams,
  MainPermission.DeleteAppTeams,
  MainPermission.UpdateAppTeamMembers,
  MainPermission.RemoveAppTeamMembers,
];

const OrganizationAppCollectionManager = [
  ...OrganizationMember,
  MainPermission.CreateAppCollections,
  MainPermission.UpdateAppCollections,
  MainPermission.DeleteAppCollections,
];

const OrganizationBlockManager = [
  ...OrganizationMember,
  MainPermission.PublishBlocks,
  MainPermission.DeleteBlocks,
];

const OrganizationMaintainer = [
  ...OrganizationAppManager,
  ...OrganizationAppTeamManager,
  ...OrganizationAppCollectionManager,
  ...OrganizationBlockManager,
  MainPermission.CreateApps,
  MainPermission.DeleteApps,
  MainPermission.CreateOrganizationInvites,
  MainPermission.UpdateOrganizationInvites,
  MainPermission.DeleteOrganizationInvites,
];

const OrganizationOwner = [
  ...OrganizationMaintainer,
  MainPermission.UpdateOrganizations,
  MainPermission.DeleteOrganizations,
  MainPermission.UpdateOrganizationMembers,
  MainPermission.RemoveOrganizationMembers,
];

export const organizationMemberRoles = {
  Member: OrganizationMember,
  AppTranslator: OrganizationAppTranslator,
  AppContentsExplorer: OrganizationAppContentsExplorer,
  AppContentsManager: OrganizationAppContentsManager,
  AppManager: OrganizationAppManager,
  AppTeamManager: OrganizationAppTeamManager,
  AppCollectionManager: OrganizationAppCollectionManager,
  BlockManager: OrganizationBlockManager,
  Maintainer: OrganizationMaintainer,
  Owner: OrganizationOwner,
};

export type OrganizationMemberRole = keyof typeof organizationMemberRoles;

export enum TeamMemberRole {
  Member = 'member',
  Manager = 'manager',
}
