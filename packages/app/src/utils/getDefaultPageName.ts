import { AppDefinition } from '@appsemble/types';
import { resolveRoleInheritance } from '@appsemble/utils';

export function getDefaultPageName(
  isLoggedIn: boolean,
  role: string,
  definition: Pick<AppDefinition, 'defaultPage' | 'security'>,
): string {
  if (!isLoggedIn) {
    return definition.defaultPage;
  }

  for (const [, roleDefinition] of resolveRoleInheritance(definition, role)) {
    if (roleDefinition.defaultPage) {
      return roleDefinition.defaultPage;
    }
  }

  return definition.defaultPage;
}
