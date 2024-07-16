import { AppPermission, OrganizationPermission, TeamPermission } from './permissions.js';

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
];

const OrganizationAppContentsManager = [
  ...OrganizationAppContentsExplorer,
  OrganizationPermission.CreateAppAssets,
  OrganizationPermission.UpdateAppAssets,
  OrganizationPermission.DeleteAppAssets,
  OrganizationPermission.CreateAppResources,
  OrganizationPermission.UpdateAppResources,
  OrganizationPermission.DeleteAppResources,
];

const OrganizationAppMemberManager = [
  OrganizationPermission.CreateAppInvites,
  OrganizationPermission.QueryAppMembers,
  OrganizationPermission.RemoveAppMembers,
];

const OrganizationAppTeamManager = [
  OrganizationPermission.QueryTeams,
  OrganizationPermission.CreateTeams,
  OrganizationPermission.UpdateTeams,
  OrganizationPermission.DeleteTeams,
];

const OrganizationAppManager = [
  ...OrganizationAppTranslator,
  ...OrganizationAppContentsManager,
  ...OrganizationAppMemberManager,
  ...OrganizationAppTeamManager,
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
  AppTeamManager: OrganizationAppTeamManager,
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

const AppTeamsManager = [
  ...AppMember,
  AppPermission.CreateTeams,
  AppPermission.UpdateTeams,
  AppPermission.DeleteTeams,
];

const AppOwner = [...AppMember, ...AppMembersManager, ...AppTeamsManager];

export const appMemberRoles = {
  Member: AppMember,
  MembersManager: AppMembersManager,
  TeamsManager: AppTeamsManager,
  Owner: AppOwner,
};

export type AppMemberRole = string | keyof typeof appMemberRoles;

const TeamMember: TeamPermission[] = [];

const TeamManager = [
  TeamPermission.CreateTeamInvites,
  TeamPermission.UpdateTeamMembers,
  TeamPermission.RemoveTeamMembers,
];

export const teamMemberRoles = {
  Member: TeamMember,
  Manager: TeamManager,
};

export type TeamMemberRole = keyof typeof teamMemberRoles;
