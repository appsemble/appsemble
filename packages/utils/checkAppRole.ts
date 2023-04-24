import { type Security, type TeamMember } from '@appsemble/types';

/**
 * Check if the given user has access to any of the given scopes.
 *
 * @param securityDefinition The security definition to use for checking the role.
 * @param role The role the user is checked against.
 * @param userRole The role the user has.
 * @param teams The teams the user is in.
 * @returns Whether or not the user has the role.
 */
export function checkAppRole(
  securityDefinition: Security,
  role: string,
  userRole: string,
  teams: Pick<TeamMember, 'role'>[],
): boolean {
  if (role === userRole) {
    return true;
  }

  if (role === '$public' && userRole) {
    return true;
  }

  if (role === '$none' && !userRole) {
    return true;
  }

  if (role === '$team:manager') {
    return teams.some((team) => team.role === 'manager');
  }

  if (role === '$team:member') {
    return Boolean(teams.some((team) => team.role));
  }

  if (!userRole) {
    return false;
  }

  if (securityDefinition.roles[userRole].inherits) {
    return securityDefinition.roles[userRole].inherits.some((inheritedRole) =>
      checkAppRole(securityDefinition, role, inheritedRole, teams),
    );
  }

  return false;
}
