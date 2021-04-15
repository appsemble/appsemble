import { AppDefinition, RoleDefinition } from '@appsemble/types';

export function resolveRoleInheritance(
  app: AppDefinition,
  role: string,
): [roleName: string, roleDefinition: RoleDefinition][] {
  const rolesDefinition = app?.security?.roles;
  const roleNames: string[] = [];
  const roles: RoleDefinition[] = [];

  const resolveRoles = (r: string): void => {
    const roleDefinition = rolesDefinition[r];
    if (!r || !roleDefinition) {
      return;
    }
    if (roles.includes(roleDefinition)) {
      return;
    }
    roleNames.push(r);
    roles.push(roleDefinition);
    roleDefinition.inherits?.forEach(resolveRoles);
  };

  if (rolesDefinition) {
    resolveRoles(role);
  }

  return roles.map((r, index) => [roleNames[index], r]);
}

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
