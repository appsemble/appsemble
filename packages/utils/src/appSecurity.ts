import { AppDefinition, RoleDefinition } from '@appsemble/types';

import { has } from './has';

/**
 * Resolve role security inheritance based on priority.
 *
 * @param app - The app to resolve role priority for.
 * @param role - The role to resolve
 * @returns A list of tuples of role name and role definition. The roles are sorted by priority.
 */
export function resolveRoleInheritance(
  app: Pick<AppDefinition, 'security'>,
  role: string,
): [roleName: string, roleDefinition: RoleDefinition][] {
  const rolesDefinition = app?.security?.roles;
  const roleNames: string[] = [];
  const roles: RoleDefinition[] = [];

  const resolveRoles = (r: string): void => {
    if (!r) {
      // No role was specified.
      return;
    }
    if (!has(rolesDefinition, r)) {
      // The specified role is unknown, so it’s skipped.
      return;
    }
    if (roleNames.includes(r)) {
      // The role has already been processed higher up the priority.
      return;
    }
    const roleDefinition = rolesDefinition[r];
    roleNames.push(r);
    roles.push(roleDefinition);
    if (roleDefinition.inherits) {
      for (const inherits of roleDefinition.inherits) {
        resolveRoles(inherits);
      }
    }
  };

  if (rolesDefinition) {
    resolveRoles(role);
  }

  return roles.map((r, index) => [roleNames[index], r]);
}
