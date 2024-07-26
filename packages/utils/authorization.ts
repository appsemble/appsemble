import { CustomAppPermission, CustomAppResourcePermission, Security } from "@appsemble/types";
import {
  appMemberRoles, appOrganizationPermissionMapping,
  AppPermission,
  OrganizationMemberRole,
  organizationMemberRoles, OrganizationPermission
} from "./constants/index.js";

export function getAppRolePermissionsRecursively(
  appSecurityDefinition: Security,
  appRoles: string[],
): CustomAppPermission[] {
  const accumulatedPermissions: CustomAppPermission[] = [];

  for (const appRole of appRoles) {
    const appRoleAccumulatedPermissions: CustomAppPermission[] = [];
    const appRoleDefinition = appSecurityDefinition.roles[appRole];

    if (appRoleDefinition) {
      const appRolePermissions = appRoleDefinition.permissions;
      if (appRolePermissions) {
        appRoleAccumulatedPermissions.push(...appRolePermissions);
      }

      const appRoleInherits = appRoleDefinition.inherits;
      if (appRoleInherits) {
        appRoleAccumulatedPermissions.push(
          ...getAppRolePermissionsRecursively(appSecurityDefinition, appRoleInherits),
        );
      }
    } else {
      const predefinedRolePermissions = appMemberRoles[appRole as keyof typeof appMemberRoles];
      if (predefinedRolePermissions) {
        appRoleAccumulatedPermissions.push(...predefinedRolePermissions);
      }
    }

    accumulatedPermissions.push(...appRoleAccumulatedPermissions);
  }

  return accumulatedPermissions;
}

export function checkAppRoleAppPermissions(
  appSecurityDefinition: Security,
  appRole: string,
  requiredPermissions: CustomAppPermission[],
): boolean {
  const appRolePermissions = getAppRolePermissionsRecursively(appSecurityDefinition, [appRole]);

  return requiredPermissions.every((p) => {
    if (appRolePermissions.includes(p)) {
      return true;
    }

    if (p.startsWith('$resource')) {
      const permissionAction = p.slice(p.lastIndexOf(':') + 1);
      return appRolePermissions.includes(`$resource:all:${permissionAction}` as AppPermission);
    }
  });
}

export function checkOrganizationRoleAppPermissions(
  organizationRole: OrganizationMemberRole,
  requiredPermissions: CustomAppPermission[],
): boolean {
  const organizationRolePermissions = organizationMemberRoles[organizationRole];

  return requiredPermissions.every((p) => {
    let mappedPermission = appOrganizationPermissionMapping[p as AppPermission];

    if (!mappedPermission) {
      const customAppPermission = p as string;

      if (customAppPermission.startsWith('$resource')) {
        mappedPermission =
          appOrganizationPermissionMapping[
            (p as CustomAppResourcePermission).replace(/:[^:]*:/, ':all:') as AppPermission
            ];
      }
    }

    return organizationRolePermissions.includes(mappedPermission);
  });
}

export function checkOrganizationRoleOrganizationPermissions(
  organizationRole: OrganizationMemberRole,
  requiredPermissions: OrganizationPermission[],
): boolean {
  return requiredPermissions.every((p) => organizationMemberRoles[organizationRole].includes(p));
}
