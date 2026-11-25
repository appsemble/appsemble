import {
  type OrganizationPermission,
  type PredefinedOrganizationRole,
  predefinedOrganizationRolePermissions,
} from '@appsemble/types';

export function checkOrganizationRoleOrganizationPermissions(
  organizationRole: null | PredefinedOrganizationRole | readonly PredefinedOrganizationRole[],
  requiredPermissions: OrganizationPermission[],
): boolean {
  const roles =
    typeof organizationRole === 'string' ? [organizationRole] : (organizationRole ?? []);
  const grantedPermissions = new Set(
    roles.flatMap((role) => predefinedOrganizationRolePermissions[role]),
  );
  return (
    roles.length > 0 &&
    requiredPermissions.every((permission) => grantedPermissions.has(permission))
  );
}
