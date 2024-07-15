import {
  type OrganizationMemberRole,
  organizationMemberRoles,
  type OrganizationPermission,
} from '@appsemble/utils';

export function checkRole(
  role: OrganizationMemberRole,
  permission: OrganizationPermission,
): boolean {
  if (!role) {
    return false;
  }

  return organizationMemberRoles[role].includes(permission);
}
