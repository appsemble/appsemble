/**
 * A permission an app member may have within an app because of their given role.
 */
export enum AppsPermission {
  /**
   * The permission to create app invites.
   */
  CreateAppInvites,

  /**
   * The permission to query app members.
   */
  QueryAppMembers,

  /**
   * The permission to query app members.
   */
  RemoveAppMembers,
}

/**
 * A permission a user may have within the platform because of their given role.
 */
export enum MainPermission {
  /**
   * The permission to publish blocks for an organization.
   */
  PublishBlocks,

  /**
   * The permission to delete blocks for an organization.
   */
  DeleteBlocks,

  /**
   * The permission to create apps.
   */
  CreateApps,

  /**
   * The permission to view private apps of an organization.
   */
  QueryApps,

  /**
   * The permission to update apps.
   */
  UpdateApps,

  /**
   * The permission to delete apps.
   */
  DeleteApps,

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
   * The permission to create app secrets.
   */
  CreateAppVariables,

  /**
   * The permission to update app secrets.
   */
  UpdateAppVariables,

  /**
   * The permission to delete app secrets.
   */
  DeleteAppVariables,

  /**
   * The permission to create app resources.
   */
  CreateAppResources,

  /**
   * The permission to query app resources.
   */
  QueryAppResources,

  /**
   * The permission to update app resources.
   */
  UpdateAppResources,

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
   * The permission to create app teams.
   */
  CreateAppTeams,

  /**
   * The permission to delete app teams.
   */
  DeleteAppTeams,

  /**
   * The permission to update app team members.
   */
  UpdateAppTeamMembers,

  /**
   * The permission to remove app team members.
   */
  RemoveAppTeamMembers,

  /**
   * The permission to update organizations.
   */
  UpdateOrganizations,

  /**
   * The permission to delete organizations.
   */
  DeleteOrganizations,

  /**
   * The permission to create organization invites,
   */
  CreateOrganizationInvites,

  /**
   * The permission to update organization invites,
   */
  UpdateOrganizationInvites,

  /**
   * The permission to delete organization invites,
   */
  DeleteOrganizationInvites,

  /**
   * The permission to view the list of members in an organization.
   */
  QueryOrganizationMembers,

  /**
   * The permission to change the roles of organization members.
   */
  UpdateOrganizationMembers,

  /**
   * The permission to remove organization members.
   */
  RemoveOrganizationMembers,

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
