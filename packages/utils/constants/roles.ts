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
  OrganizationPermission.InviteAppMembers,
  OrganizationPermission.QueryAppMembers,
  OrganizationPermission.RemoveAppMembers,
];

const OrganizationAppTeamManager = [
  OrganizationPermission.QueryTeams,
  OrganizationPermission.CreateTeams,
  OrganizationPermission.UpdateTeams,
  OrganizationPermission.DeleteTeams,
];

const OrganizationAppTeamMembersManager = [
  OrganizationPermission.QueryTeamMembers,
  OrganizationPermission.CreateTeamInvites,
  OrganizationPermission.UpdateTeamMembers,
  OrganizationPermission.RemoveTeamMembers,
];

const OrganizationAppManager = [
  ...OrganizationAppTranslator,
  ...OrganizationAppContentsManager,
  ...OrganizationAppMemberManager,
  ...OrganizationAppTeamManager,
  ...OrganizationAppTeamMembersManager,
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
  AppTeamMembersManager: OrganizationAppTeamMembersManager,
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
  AppPermission.InviteAppMembers,
  AppPermission.QueryAppMembers,
  AppPermission.RemoveAppMembers,
];

const AppTeamsManager = [
  ...AppMember,
  AppPermission.QueryTeams,
  AppPermission.CreateTeams,
  AppPermission.UpdateTeams,
  AppPermission.DeleteTeams,
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

const AppOwner = [...AppMember, ...AppMembersManager, ...AppTeamsManager, ...AppResourcesManager];

export const appMemberRoles = {
  Member: AppMember,
  MembersManager: AppMembersManager,
  TeamsManager: AppTeamsManager,
  ResourcesManager: AppResourcesManager,
  Owner: AppOwner,
};

export type AppMemberRole = string | keyof typeof appMemberRoles;

const TeamMember: TeamPermission[] = [TeamPermission.QueryTeamMembers];

const TeamManager = [
  ...TeamMember,
  TeamPermission.CreateTeamInvites,
  TeamPermission.UpdateTeamMembers,
  TeamPermission.RemoveTeamMembers,
];

export const teamMemberRoles = {
  Member: TeamMember,
  Manager: TeamManager,
};

export type TeamMemberRole = keyof typeof teamMemberRoles;
