import { type Security, type TeamMember } from '@appsemble/types';

/**
 * Check if the given user has access to any of the given scopes.
 *
 * @param securityDefinition The security definition to use for checking the role.
 * @param role The role the user is checked against.
 * @param appMemberRole The role the app member has.
 * @param teams The teams the user is in.
 * @returns Whether or not the user has the role.
 */
export function checkAppRole(
  securityDefinition: Security,
  role: string,
  appMemberRole: string,
  teams: Pick<TeamMember, 'role'>[],
): boolean {
  if (role === appMemberRole) {
    return true;
  }

  if (role === '$public' && appMemberRole) {
    return true;
  }

  if (role === '$none' && !appMemberRole) {
    return true;
  }

  if (role === '$team:manager') {
    return teams.some((team) => team.role === 'Manager');
  }

  if (role === '$team:member') {
    return Boolean(teams.some((team) => team.role));
  }

  if (!appMemberRole) {
    return false;
  }

  if (securityDefinition.roles[appMemberRole].inherits) {
    return securityDefinition.roles[appMemberRole].inherits.some((inheritedRole) =>
      checkAppRole(securityDefinition, role, inheritedRole, teams),
    );
  }

  return false;
}
