import { AppDefinition } from '@appsemble/types';

export function getDefaultPageName(
  isLoggedIn: boolean,
  role: string,
  definition: Pick<AppDefinition, 'defaultPage' | 'security'>,
): string {
  if (!isLoggedIn) {
    return definition.defaultPage;
  }

  let defaultPage = definition.security.roles[role]?.defaultPage;

  if (defaultPage) {
    return defaultPage;
  }

  const inheritedRole = definition.security.roles[role]?.inherits?.find(
    (r) => definition.security.roles[r].defaultPage,
  );

  if (inheritedRole) {
    defaultPage = definition.security.roles[inheritedRole]?.defaultPage;
  }

  return defaultPage || definition.defaultPage;
}
