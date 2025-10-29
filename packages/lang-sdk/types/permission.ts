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
   * The permission to add new members to a group.
   *
   */
  CreateGroupMembers = '$group:member:create',

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
