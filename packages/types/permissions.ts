/**
 * A permission an app member may have within an app because of their given role.
 */
export enum AppPermission {
  /**
   * The permission to create app invites.
   */
  CreateAppInvites = '$member:invite',

  /**
   * The permission to query app members.
   */
  QueryAppMembers = '$member:query',

  /**
   * The permission to query app members.
   */
  DeleteAppMembers = '$member:delete',

  /**
   * The permission to update the role of app members.
   */
  UpdateAppMemberRoles = '$member:role:update',

  /**
   * The permission to patch the properties of app members.
   */
  PatchAppMemberProperties = '$member:properties:patch',

  /**
   * The permission to query app groups.
   */
  QueryGroups = '$group:query',

  /**
   * The permission to create app groups.
   */
  CreateGroups = '$group:create',

  /**
   * The permission to update app groups.
   */
  UpdateGroups = '$group:update',

  /**
   * The permission to create app groups.
   */
  DeleteGroups = '$group:delete',

  /**
   * The permission to create group invites.
   */
  CreateGroupInvites = '$group:member:invite',

  /**
   * The permission to query app members.
   */
  QueryGroupMembers = '$group:member:query',

  /**
   * The permission to delete group members.
   */
  RemoveGroupMembers = '$group:member:delete',

  /**
   * The permission to change the role of members in a group.
   */
  UpdateGroupMemberRoles = '$group:member:role:update',

  /**
   * The permission to create any app resources.
   */
  CreateResources = '$resource:all:create',

  /**
   * The permission to fetch history of a resource.
   */
  GetResourceHistory = '$resource:all:history:get',

  /**
   * The permission to query app resources.
   */
  QueryResources = '$resource:all:query',

  /**
   * The permission to get app resources.
   */
  GetResources = '$resource:all:get',

  /**
   * The permission to update app resources.
   */
  UpdateResources = '$resource:all:update',

  /**
   * The permission to patch app resources.
   */
  PatchResources = '$resource:all:patch',

  /**
   * The permission to delete app resources.
   */
  DeleteResources = '$resource:all:delete',

  /**
   * The permission to query own app resources.
   */
  QueryOwnResources = '$resource:all:own:query',

  /**
   * The permission to get own app resources.
   */
  GetOwnResources = '$resource:all:own:get',

  /**
   * The permission to update own app resources.
   */
  UpdateOwnResources = '$resource:all:own:update',

  /**
   * The permission to patch own app resources.
   */
  PatchOwnResources = '$resource:all:own:patch',

  /**
   * The permission to delete own app resources.
   */
  DeleteOwnResources = '$resource:all:own:delete',
}

/**
 * A permission a user may have within the platform because of their given role.
 */
export enum OrganizationPermission {
  /**
   * The permission to publish blocks for an organization.
   */
  PublishBlocks,

  /**
   * The permission to delete blocks for an organization.
   */
  DeleteBlocks,

  /**
   * The permission to create apps in an organization
   */
  CreateApps,

  /**
   * The permission to view private apps of an organization.
   */
  QueryApps,

  /**
   * The permission to update apps in an organization.
   */
  UpdateApps,

  /**
   * The permission to delete apps in an organization.
   */
  DeleteApps,

  /**
   * The permission to query app translations.
   */
  QueryAppMessages,

  /**
   * The permission to create app translations.
   */
  CreateAppMessages,

  /**
   * The permission to update app translations.
   */
  UpdateAppMessages,

  /**
   * The permission to delete app translations.
   */
  DeleteAppMessages,

  /**
   * The permission to read app settings.
   */
  ReadAppSettings,

  /**
   * The permission to update app settings.
   */
  UpdateAppSettings,

  /**
   * The permission to create app screenshots.
   */
  CreateAppScreenshots,

  /**
   * The permission to delete app screenshots.
   */
  DeleteAppScreenshots,

  /**
   * The permission to create app readmes.
   */
  CreateAppReadmes,

  /**
   * The permission to delete app readmes.
   */
  DeleteAppReadmes,

  /**
   * The permission to create app secrets.
   */
  CreateAppSecrets,

  /**
   * The permission to query app secrets.
   */
  QueryAppSecrets,

  /**
   * The permission to update app secrets.
   */
  UpdateAppSecrets,

  /**
   * The permission to delete app secrets.
   */
  DeleteAppSecrets,

  /**
   * The permission to query app variables.
   */
  QueryAppVariables,

  /**
   * The permission to create app variables.
   */
  CreateAppVariables,

  /**
   * The permission to update app variables.
   */
  UpdateAppVariables,

  /**
   * The permission to delete app variables.
   */
  DeleteAppVariables,

  /**
   * The permission to create app resources.
   */
  CreateAppResources,

  /**
   * The permission to fetch history of a resource.
   */
  GetAppResourceHistory,

  /**
   * The permission to query app resources.
   */
  QueryAppResources,

  /**
   * The permission to get app resources.
   */
  GetAppResources,

  /**
   * The permission to update app resources.
   */
  UpdateAppResources,

  /**
   * The permission to patch app resources.
   */
  PatchAppResources,

  /**
   * The permission to delete app resources.
   */
  DeleteAppResources,

  /**
   * The permission to create app assets.
   */
  CreateAppAssets,

  /**
   * The permission to query app assets.
   */
  QueryAppAssets,

  /**
   * The permission to update app assets.
   */
  UpdateAppAssets,

  /**
   * The permission to delete app assets.
   */
  DeleteAppAssets,

  /**
   * The permission to update organizations.
   */
  UpdateOrganizations,

  /**
   * The permission to delete organizations.
   */
  DeleteOrganizations,

  /**
   * The permission to create organization invites.
   */
  CreateOrganizationInvites,

  /**
   * The permission to query organization invites.
   */
  QueryOrganizationInvites,

  /**
   * The permission to update organization invites.
   */
  UpdateOrganizationInvites,

  /**
   * The permission to delete organization invites.
   */
  DeleteOrganizationInvites,

  /**
   * The permission to view the list of members in an organization.
   */
  QueryOrganizationMembers,

  /**
   * The permission to remove organization members.
   */
  RemoveOrganizationMembers,

  /**
   * The permission to change the roles of organization members.
   */
  UpdateOrganizationMemberRoles,

  /**
   * The permission to create app invites.
   */
  CreateAppInvites,

  /**
   * The permission to query app invites,
   */
  QueryAppInvites,

  /**
   * The permission to delete app invites.
   */
  DeleteAppInvites,

  /**
   * The permission to query app members.
   */
  QueryAppMembers,

  /**
   * The permission to delete app members.
   */
  DeleteAppMembers,

  /**
   * The permission to update the role of app members.
   */
  UpdateAppMemberRoles,

  /**
   * The permission to patch the properties of app members.
   */
  PatchAppMemberProperties,

  /**
   * The permission to query app groups.
   */
  QueryGroups,

  /**
   * The permission to create app groups.
   */
  CreateGroups,

  /**
   * The permission to update app groups.
   */
  UpdateGroups,

  /**
   * The permission to create app groups.
   */
  DeleteGroups,

  /**
   * The permission to create group invites.
   */
  CreateGroupInvites,

  /**
   * The permission to query group invites.
   */
  QueryGroupInvites,

  /**
   * The permission to delete group invites.
   */
  DeleteGroupInvites,

  /**
   * The permission to query group members.
   */
  QueryGroupMembers,

  /**
   * The permission to remove group members.
   */
  RemoveGroupMembers,

  /**
   * The permission to update group member roles.
   */
  UpdateGroupMemberRoles,

  /**
   * The permission to query app snapshots.
   */
  QueryAppSnapshots,

  /**
   * The permission to create app collections.
   */
  CreateAppCollections,

  /**
   * The permission to delete app collections.
   */
  DeleteAppCollections,

  /**
   * The permission to update app collections.
   */
  UpdateAppCollections,

  /**
   * The permission to send manual push notifications for an app.
   */
  PushAppNotifications,
}

export const appOrganizationPermissionMapping: { [key in AppPermission]: OrganizationPermission } =
  {
    [AppPermission.CreateAppInvites]: OrganizationPermission.CreateAppInvites,
    [AppPermission.QueryAppMembers]: OrganizationPermission.QueryAppMembers,
    [AppPermission.DeleteAppMembers]: OrganizationPermission.DeleteAppMembers,
    [AppPermission.UpdateAppMemberRoles]: OrganizationPermission.UpdateAppMemberRoles,
    [AppPermission.PatchAppMemberProperties]: OrganizationPermission.PatchAppMemberProperties,
    [AppPermission.CreateGroups]: OrganizationPermission.CreateGroups,
    [AppPermission.QueryGroups]: OrganizationPermission.QueryGroups,
    [AppPermission.UpdateGroups]: OrganizationPermission.UpdateGroups,
    [AppPermission.DeleteGroups]: OrganizationPermission.DeleteGroups,
    [AppPermission.CreateGroupInvites]: OrganizationPermission.CreateGroupInvites,
    [AppPermission.QueryGroupMembers]: OrganizationPermission.QueryGroupMembers,
    [AppPermission.RemoveGroupMembers]: OrganizationPermission.RemoveGroupMembers,
    [AppPermission.UpdateGroupMemberRoles]: OrganizationPermission.UpdateGroupMemberRoles,
    [AppPermission.CreateResources]: OrganizationPermission.CreateAppResources,
    [AppPermission.QueryResources]: OrganizationPermission.QueryAppResources,
    [AppPermission.GetResources]: OrganizationPermission.GetAppResources,
    [AppPermission.GetResourceHistory]: OrganizationPermission.GetAppResourceHistory,
    [AppPermission.UpdateResources]: OrganizationPermission.UpdateAppResources,
    [AppPermission.PatchResources]: OrganizationPermission.PatchAppResources,
    [AppPermission.DeleteResources]: OrganizationPermission.DeleteAppResources,
    [AppPermission.QueryOwnResources]: OrganizationPermission.QueryAppResources,
    [AppPermission.GetOwnResources]: OrganizationPermission.GetAppResources,
    [AppPermission.UpdateOwnResources]: OrganizationPermission.UpdateAppResources,
    [AppPermission.PatchOwnResources]: OrganizationPermission.PatchAppResources,
    [AppPermission.DeleteOwnResources]: OrganizationPermission.DeleteAppResources,
  };
