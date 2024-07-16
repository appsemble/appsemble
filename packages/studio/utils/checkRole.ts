import {
  type OrganizationMemberRole,
  organizationMemberRoles,
  type OrganizationPermission,
} from '@appsemble/utils';

export function checkRole(
  role: OrganizationMemberRole,
  permissions: OrganizationPermission[],
): boolean {
  if (!role) {
    return false;
  }

  const rolePermissions = organizationMemberRoles[role];
  return permissions.every((permission) => rolePermissions.includes(permission));
}
