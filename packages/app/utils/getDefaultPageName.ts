import { type AppDefinition, type AppRole } from '@appsemble/types';
import { getAppInheritedRoles } from '@appsemble/utils';

export function getDefaultPageName(
  isLoggedIn: boolean,
  appMemberRole: AppRole,
  appDefinition: Pick<AppDefinition, 'defaultPage' | 'security'>,
): string {
  if (!isLoggedIn) {
    return appDefinition.defaultPage;
  }

  if (appDefinition.security) {
    for (const role of getAppInheritedRoles(appDefinition.security, [appMemberRole])) {
      const roleDefinition = appDefinition.security.roles?.[role];
      if (roleDefinition && roleDefinition.defaultPage) {
        return roleDefinition.defaultPage;
      }
    }
  }

  return appDefinition.defaultPage;
}
