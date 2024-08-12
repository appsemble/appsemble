import {
  type AppDefinition,
  appOrganizationPermissionMapping,
  type AppPermission,
  type AppRole,
  appRoles,
  type CustomAppPermission,
  type CustomAppResourcePermission,
  type OrganizationPermission,
  type OrganizationRole,
  organizationRoles,
  type Security,
} from '@appsemble/types';

function checkAppPermissions(
  acquiredPermissions: CustomAppPermission[],
  requiredPermissions: CustomAppPermission[]
): boolean {
  return requiredPermissions.every((p) => {
    if (acquiredPermissions.includes(p)) {
      return true;
    }

    if (p.startsWith('$resource')) {
      const permissionAction = p.slice(p.lastIndexOf(':') + 1);
      return acquiredPermissions.includes(`$resource:all:${permissionAction}` as AppPermission);
    }
  });
}

export function getGuestAppPermissions(appSecurityDefinition: Security): CustomAppPermission[] {
  if (!appSecurityDefinition || !appSecurityDefinition.guest) {
    return [];
  }

  return appSecurityDefinition.guest.permissions;
}

export function checkGuestAppPermissions(
  appSecurityDefinition: Security,
  requiredPermissions: CustomAppPermission[],
): boolean {
  const guestPermissions = getGuestAppPermissions(appSecurityDefinition);
  return checkAppPermissions(guestPermissions, requiredPermissions);
}

export function getAppRoles(appDefinition: AppDefinition): AppRole[] {
  return Array.from(
    new Set([...Object.keys(appDefinition?.security?.roles || {}), ...Object.keys(appRoles)]),
  );
}

export function getAppInheritedRoles(appSecurityDefinition: Security, roles: AppRole[]): AppRole[] {
  if (!appSecurityDefinition) {
    return [];
  }

  const accumulatedRoles: AppRole[] = [];

  for (const role of roles) {
    if (!accumulatedRoles.includes(role)) {
      accumulatedRoles.push(role);

      const roleDefinition = appSecurityDefinition.roles[role];
      if (roleDefinition && roleDefinition.inherits) {
        accumulatedRoles.push(
          ...getAppInheritedRoles(appSecurityDefinition, roleDefinition.inherits),
        );
      }
    }
  }

  return accumulatedRoles;
}

export function getAppRolePermissions(
  appSecurityDefinition: Security,
  roles: AppRole[],
): CustomAppPermission[] {
  const accumulatedPermissions: CustomAppPermission[] = [];
  const inheritedRoles = getAppInheritedRoles(appSecurityDefinition, roles);

  for (const role of inheritedRoles) {
    const roleDefinition = appSecurityDefinition.roles[role];

    if (roleDefinition) {
      const rolePermissions = roleDefinition.permissions;
      if (rolePermissions) {
        accumulatedPermissions.push(...rolePermissions);
      }
    } else {
      const predefinedRolePermissions = appRoles[role as keyof typeof appRoles];
      if (predefinedRolePermissions) {
        accumulatedPermissions.push(...predefinedRolePermissions);
      }
    }
  }

  return Array.from(new Set(accumulatedPermissions));
}

export function checkAppRoleAppPermissions(
  appSecurityDefinition: Security,
  appRole: string,
  requiredPermissions: CustomAppPermission[],
): boolean {
  const appRolePermissions = getAppRolePermissions(appSecurityDefinition, [appRole]);
  return checkAppPermissions(appRolePermissions, requiredPermissions);
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
