/**
 * A permission a user may have within an organization because of their given role.
 */
enum Permission {
  ViewApps,
  ManageRoles,
  ManageMembers,
  PublishBlocks,
  CreateApps,
  EditApps,
  EditAppMessages,
  EditAppSettings,
  EditThemes,
  DeleteApps,
  PushNotifications,
  ManageResources,
  InviteMember,
}

export default Permission;
