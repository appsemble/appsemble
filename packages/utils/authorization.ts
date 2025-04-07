import {
  type OrganizationPermission,
  type PredefinedOrganizationRole,
  predefinedOrganizationRolePermissions,
} from '@appsemble/types';

export function checkOrganizationRoleOrganizationPermissions(
  organizationRole: PredefinedOrganizationRole,
  requiredPermissions: OrganizationPermission[],
): boolean {
  return requiredPermissions.every((p) =>
    predefinedOrganizationRolePermissions[organizationRole].includes(p),
  );
}
