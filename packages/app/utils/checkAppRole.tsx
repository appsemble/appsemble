import { Security } from '@appsemble/types';

/**
 * Check if the given user has access to any of the given scopes.
 *
 * @param scopes The scopes to check against.
 * @param user The user to verify.
 * @returns Wether or not the user has access to any of the given scopes.
 */
export default function checkAppRole(
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
    return securityDefinition.roles[userRole].inherits.some(inheritedRole =>
      checkAppRole(securityDefinition, role, inheritedRole),
    );
  }

  return false;
}
