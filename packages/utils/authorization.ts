import {
  type App,
  type CustomAppPermission,
  type CustomAppResourcePermission,
  type Security,
} from '@appsemble/types';

import {
  appOrganizationPermissionMapping,
  type AppPermission,
  appRoles,
  type OrganizationPermission,
  type OrganizationRole,
  organizationRoles,
} from './constants/index.js';

export function getAppRoles(app: App): string[] {
  return Array.from(
    new Set([...Object.keys(app?.definition.security?.roles || {}), ...Object.keys(appRoles)]),
  );
}

export function getAppRolePermissionsRecursively(
  appSecurityDefinition: Security,
  roles: string[],
): CustomAppPermission[] {
  const accumulatedPermissions: CustomAppPermission[] = [];

  for (const appRole of roles) {
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
      const predefinedRolePermissions = appRoles[appRole as keyof typeof appRoles];
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
  organizationRole: OrganizationRole,
  requiredPermissions: CustomAppPermission[],
): boolean {
  const organizationRolePermissions = organizationRoles[organizationRole];

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
  organizationRole: OrganizationRole,
  requiredPermissions: OrganizationPermission[],
): boolean {
  return requiredPermissions.every((p) => organizationRoles[organizationRole].includes(p));
}
