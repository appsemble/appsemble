import { type AppDefinition, type AppRole, getAppInheritedRoles } from '@appsemble/lang-sdk';

function normalizeAppMemberRoles(appMemberRoles: AppRole[]): AppRole[] {
  return Array.from(new Set(appMemberRoles.filter(Boolean)));
}

export function getDefaultPageName(
  isLoggedIn: boolean,
  appMemberRoles: AppRole[],
  appDefinition: Pick<AppDefinition, 'defaultPage' | 'security'>,
): string {
  if (!isLoggedIn) {
    return appDefinition.defaultPage;
  }

  if (appDefinition.security) {
    const directRoles = normalizeAppMemberRoles(appMemberRoles);

    for (const role of directRoles) {
      const roleDefinition = appDefinition.security.roles?.[role];

      if (roleDefinition?.defaultPage) {
        return roleDefinition.defaultPage;
      }
    }

    for (const role of directRoles) {
      for (const inheritedRole of getAppInheritedRoles(appDefinition.security, [role])) {
        if (inheritedRole === role) {
          continue;
        }

        const roleDefinition = appDefinition.security.roles?.[inheritedRole];

        if (roleDefinition?.defaultPage) {
          return roleDefinition.defaultPage;
        }
      }
    }
  }

  return appDefinition.defaultPage;
}
