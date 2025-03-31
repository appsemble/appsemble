import {
  type AppDefinition,
  appOrganizationPermissionMapping,
  AppPermission,
  type AppRole,
  type CustomAppGuestPermission,
  type CustomAppOwnResourcePermission,
  type CustomAppPermission,
  type CustomAppResourcePermission,
  type CustomAppResourceViewPermission,
  type OrganizationPermission,
  type PredefinedAppRole,
  predefinedAppRolePermissions,
  type PredefinedOrganizationRole,
  predefinedOrganizationRolePermissions,
  type Security,
} from '@appsemble/types';

function checkAppPermissions(
  acquiredPermissions: CustomAppPermission[],
  requiredPermissions: CustomAppPermission[],
): boolean {
  const customAppResourcePermissionPattern =
    /^\$resource:[^:]+:(get|history:get|query|create|delete|patch|update)$/;

  const customAppOwnResourcePermissionPattern =
    /^\$resource:[^:]+:own:(get|query|delete|patch|update)$/;

  const customAppResourceViewPermissionPattern = /^\$resource:[^:]+:(get|query):[^:]+$/;

  return requiredPermissions.every((p) => {
    if (acquiredPermissions.includes(p)) {
      return true;
    }

    if (customAppResourcePermissionPattern.test(p)) {
      const [, , resourceAction] = (p as CustomAppResourcePermission).split(':');
      return acquiredPermissions.includes(`$resource:all:${resourceAction}` as CustomAppPermission);
    }

    if (customAppOwnResourcePermissionPattern.test(p)) {
      const [, resourceName, , resourceAction] = (p as CustomAppOwnResourcePermission).split(':');
      return (
        acquiredPermissions.includes(`$resource:all:${resourceAction}` as CustomAppPermission) ||
        acquiredPermissions.includes(
          `$resource:all:own:${resourceAction}` as CustomAppPermission,
        ) ||
        acquiredPermissions.includes(
          `$resource:${resourceName}:${resourceAction}` as CustomAppPermission,
        )
      );
    }

    if (customAppResourceViewPermissionPattern.test(p)) {
      const [, resourceName, resourceAction, view] = (p as CustomAppResourceViewPermission).split(
        ':',
      );

      return (
        acquiredPermissions.includes(
          `$resource:${resourceName}:${resourceAction}` as CustomAppPermission,
        ) ||
        acquiredPermissions.includes(`$resource:all:${resourceAction}` as CustomAppPermission) ||
        acquiredPermissions.includes(
          `$resource:all:${resourceAction}:${view}` as CustomAppPermission,
        )
      );
    }
  });
}

export function getAppInheritedRoles(
  appSecurityDefinition: Security,
  roles: AppRole[],
  accumulatedRoles: AppRole[] = [],
): AppRole[] {
  if (!appSecurityDefinition || !roles) {
    return [];
  }

  for (const role of roles) {
    if (!accumulatedRoles.includes(role)) {
      accumulatedRoles.push(role);

      const roleDefinition = appSecurityDefinition.roles?.[role];
      if (roleDefinition && roleDefinition.inherits) {
        accumulatedRoles.push(
          ...getAppInheritedRoles(appSecurityDefinition, roleDefinition.inherits, accumulatedRoles),
        );
      }
    }
  }

  return Array.from(new Set(accumulatedRoles));
}

export function getAppRolePermissions(
  appSecurityDefinition: Security,
  roles: AppRole[],
): CustomAppPermission[] {
  const accumulatedPermissions: CustomAppPermission[] = [];
  const inheritedRoles = getAppInheritedRoles(appSecurityDefinition, roles);

  for (const role of inheritedRoles) {
    const roleDefinition = appSecurityDefinition.roles?.[role];

    if (roleDefinition) {
      const rolePermissions = roleDefinition.permissions;
      if (rolePermissions) {
        accumulatedPermissions.push(...rolePermissions);
      }
    } else {
      const predefinedRolePermissions = predefinedAppRolePermissions[role as PredefinedAppRole];
      if (predefinedRolePermissions) {
        accumulatedPermissions.push(...predefinedRolePermissions);
      }
    }
  }

  return Array.from(new Set(accumulatedPermissions));
}

export function getGuestAppPermissions(appSecurityDefinition: Security): CustomAppPermission[] {
  if (!appSecurityDefinition || !appSecurityDefinition.guest) {
    return [];
  }

  return [
    ...(appSecurityDefinition.guest.permissions || []),
    ...getAppRolePermissions(appSecurityDefinition, appSecurityDefinition.guest.inherits ?? []),
  ];
}

export function checkGuestAppPermissions(
  appSecurityDefinition: Security,
  requiredPermissions: CustomAppPermission[],
): boolean {
  const guestPermissions = getGuestAppPermissions(appSecurityDefinition);
  return checkAppPermissions(guestPermissions, requiredPermissions);
}

export function getAppRoles(appSecurityDefinition?: Security): AppRole[] {
  return Array.from(new Set(Object.keys(appSecurityDefinition?.roles || {})));
}

export function getAppPossibleGuestPermissions(
  appDefinition: AppDefinition,
): CustomAppGuestPermission[] {
  const possibleAllViews: Record<string, boolean> = {};

  const resourceDefinitions = Object.values(appDefinition.resources || {});
  for (const resourceDefinition of resourceDefinitions) {
    for (const view of Object.keys(resourceDefinition.views || {})) {
      possibleAllViews[view] = true;
    }
  }

  for (const view of Object.keys(possibleAllViews)) {
    if (resourceDefinitions.some((resourceDefinition) => !resourceDefinition.views?.[view])) {
      possibleAllViews[view] = false;
    }
  }

  for (const view in possibleAllViews) {
    if (!possibleAllViews[view]) {
      delete possibleAllViews[view];
    }
  }

  return [
    ...Object.values(AppPermission),
    ...Object.entries(appDefinition.resources || {}).flatMap(
      ([resourceName, resourceDefinition]) => [
        `$resource:${resourceName}:create`,
        `$resource:${resourceName}:query`,
        `$resource:${resourceName}:get`,
        `$resource:${resourceName}:history:get`,
        `$resource:${resourceName}:update`,
        `$resource:${resourceName}:patch`,
        `$resource:${resourceName}:delete`,
        ...Object.keys(resourceDefinition.views || {}).flatMap((resourceView) => [
          `$resource:${resourceName}:query:${resourceView}`,
          `$resource:${resourceName}:get:${resourceView}`,
        ]),
        ...Object.keys(possibleAllViews).flatMap((view) => [
          `$resource:all:query:${view}`,
          `$resource:all:get:${view}`,
        ]),
      ],
    ),
  ] as CustomAppGuestPermission[];
}

export function getAppPossiblePermissions(appDefinition: AppDefinition): CustomAppPermission[] {
  return [
    ...getAppPossibleGuestPermissions(appDefinition),
    ...Object.keys(appDefinition.resources || {}).flatMap((resourceName) => [
      `$resource:${resourceName}:own:query`,
      `$resource:${resourceName}:own:get`,
      `$resource:${resourceName}:own:update`,
      `$resource:${resourceName}:own:patch`,
      `$resource:${resourceName}:own:delete`,
    ]),
  ] as CustomAppPermission[];
}

export function getAppRolesByPermissions(
  appSecurityDefinition: Security,
  requiredPermissions: CustomAppPermission[],
): (AppRole | 'Guest')[] {
  const roles = getAppRoles(appSecurityDefinition);

  const compliantRoles: AppRole[] = [];
  for (const role of roles) {
    if (
      checkAppPermissions(getAppRolePermissions(appSecurityDefinition, [role]), requiredPermissions)
    ) {
      compliantRoles.push(role);
    }
  }

  if (checkAppPermissions(getGuestAppPermissions(appSecurityDefinition), requiredPermissions)) {
    compliantRoles.push('Guest');
  }

  return compliantRoles;
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
  organizationRole: PredefinedOrganizationRole,
  requiredPermissions: CustomAppPermission[],
): boolean {
  if (!organizationRole) {
    return false;
  }

  const organizationRolePermissions = predefinedOrganizationRolePermissions[organizationRole];

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
  organizationRole: PredefinedOrganizationRole,
  requiredPermissions: OrganizationPermission[],
): boolean {
  return requiredPermissions.every((p) =>
    predefinedOrganizationRolePermissions[organizationRole].includes(p),
  );
}
