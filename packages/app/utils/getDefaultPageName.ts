import { type AppDefinition } from '@appsemble/types';
import { type AppRole, getAppInheritedRoles } from '@appsemble/utils';

export function getDefaultPageName(
  isLoggedIn: boolean,
  appMemberRole: AppRole,
  appDefinition: AppDefinition,
): string {
  if (!isLoggedIn) {
    return appDefinition.defaultPage;
  }

  if (appDefinition.security) {
    for (const role of getAppInheritedRoles(appDefinition.security, [appMemberRole])) {
      const roleDefinition = appDefinition.security.roles[role];
      if (roleDefinition && roleDefinition.defaultPage) {
        return roleDefinition.defaultPage;
      }
    }
  }

  return appDefinition.defaultPage;
}
