import { AppPermission } from './permission.js';

const AppMemberPermissions: AppPermission[] = [];

const AppMembersManagerPermissions = [
  ...AppMemberPermissions,
  AppPermission.CreateAppInvites,
  AppPermission.QueryAppMembers,
  AppPermission.DeleteAppMembers,
  AppPermission.UpdateAppMemberRoles,
  AppPermission.PatchAppMemberProperties,
];

const AppGroupMembersManagerPermissions = [
  ...AppMemberPermissions,
  AppPermission.CreateGroupInvites,
  AppPermission.QueryGroupMembers,
  AppPermission.RemoveGroupMembers,
  AppPermission.UpdateGroupMemberRoles,
  AppPermission.CreateGroupMembers,
];

const AppGroupsManagerPermissions = [
  ...AppMemberPermissions,
  ...AppGroupMembersManagerPermissions,
  AppPermission.QueryGroups,
  AppPermission.CreateGroups,
  AppPermission.UpdateGroups,
  AppPermission.DeleteGroups,
];

const AppResourcesManagerPermissions = [
  ...AppMemberPermissions,
  AppPermission.CreateResources,
  AppPermission.QueryResources,
  AppPermission.GetResourceHistory,
  AppPermission.GetResources,
  AppPermission.UpdateResources,
  AppPermission.PatchResources,
  AppPermission.DeleteResources,
];

const AppOwnerPermissions = [
  ...AppMemberPermissions,
  ...AppMembersManagerPermissions,
  ...AppGroupMembersManagerPermissions,
  ...AppGroupsManagerPermissions,
  ...AppResourcesManagerPermissions,
];

export enum PredefinedAppRole {
  Member = 'Member',
  MembersManager = 'MembersManager',
  GroupMembersManager = 'GroupMembersManager',
  GroupsManager = 'GroupsManager',
  ResourcesManager = 'ResourcesManager',
  Owner = 'Owner',
}

export type AppRole = string;

export type ViewRole = AppRole | '$guest';

export const predefinedAppRolePermissions = {
  [PredefinedAppRole.Member]: AppMemberPermissions,
  [PredefinedAppRole.MembersManager]: AppMembersManagerPermissions,
  [PredefinedAppRole.GroupMembersManager]: AppGroupMembersManagerPermissions,
  [PredefinedAppRole.GroupsManager]: AppGroupsManagerPermissions,
  [PredefinedAppRole.ResourcesManager]: AppResourcesManagerPermissions,
  [PredefinedAppRole.Owner]: AppOwnerPermissions,
};

export const predefinedAppRoles: PredefinedAppRole[] = Object.values(PredefinedAppRole);
