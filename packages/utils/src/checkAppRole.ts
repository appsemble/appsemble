import { Security } from '@appsemble/types';

/**
 * Check if the given user has access to any of the given scopes.
 *
 * @param securityDefinition - The security definition to use for checking the role.
 * @param role - The role the user is checked against.
 * @param userRole - The role the user has.
 * @returns Whether or not the user has the role.
 */
export function checkAppRole(
  securityDefinition: Security,
  role: string,
  userRole: string,
): boolean {
  if (role === userRole) {
    return true;
  }

  if (!userRole) {
    return false;
  }

  if (securityDefinition.roles[userRole].inherits) {
    return securityDefinition.roles[userRole].inherits.some((inheritedRole) =>
      checkAppRole(securityDefinition, role, inheritedRole),
    );
  }

  return false;
}
