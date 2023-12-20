/**
 * A permission a user may have within an organization because of their given role.
 */
export enum Permission {
  /**
   * The permission to create new apps or copy them from templates.
   */
  CreateApps,

  /**
   * The permission to delete apps.
   */
  DeleteApps,

  /**
   * The permission to edit the app’s translations.
   */
  EditAppMessages,

  /**
   * The permission to edit the app’s settings.
   */
  EditAppSettings,

  /**
   * The permission to edit the app definition.
   */
  EditApps,

  /**
   * The permission to edit the name and logo of an organization.
   */
  EditOrganization,

  /**
   * The permission to delete an organization if it doesn't have any apps.
   */
  DeleteOrganization,

  /**
   * The permission to invite new members into an organization,
   * removing existing invites, and resending invites.
   */
  InviteMember,

  /**
   * The permission to create and delete assets.
   */
  ManageAssets,

  /**
   * The permission to remove organization members.
   */
  ManageMembers,

  /**
   * The permission to create, edit, and delete resources.
   */
  ManageResources,

  /**
   * The permission to change the roles of organization members.
   */
  ManageRoles,

  /**
   * The permission to create and delete teams and manage its members.
   */
  ManageTeams,

  /**
   * The permission to publish blocks for an organization.
   */
  PublishBlocks,

  /**
   * The permission to delete blocks for an organization.
   */
  DeleteBlocks,

  /**
   * The permission to send manual push notifications for an app.
   */
  PushNotifications,

  /**
   * The permission to read assets.
   */
  ReadAssets,

  /**
   * The permission to read resources.
   */
  ReadResources,

  /**
   * The permission to view private apps of an organization.
   */
  ViewApps,

  /**
   * The permission to view the list of members in an organization.
   */
  ViewMembers,

  /**
   * The permission to create collections.
   */
  CreateCollections,

  /**
   * The permission to delete collections.
   */
  DeleteCollections,

  /**
   * The permission to edit collections.
   */
  EditCollections,

  /**
   * The permission to create app accounts.
   */
  CreateAppAccounts,

  /**
   * The permission to read app accounts.
   */
  ReadAppAccounts,

  /**
   * The permission to delete app accounts.
   */
  DeleteAppAccounts,

  /**
   * The permission to edit app accounts.
   */
  EditAppAccounts,
}
