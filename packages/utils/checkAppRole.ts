import { type GroupMember, type Security } from '@appsemble/types';

/**
 * Check if the given user has access to any of the given scopes.
 *
 * @param securityDefinition The security definition to use for checking the role.
 * @param role The role the user is checked against.
 * @param appRole The role the app member has.
 * @param groups The groups the user is in.
 * @returns Whether or not the user has the role.
 */
export function checkAppRole(
  securityDefinition: Security,
  role: string,
  appRole: string,
  groups: Pick<GroupMember, 'role'>[],
): boolean {
  if (role === appRole) {
    return true;
  }

  if (role === '$public' && appRole) {
    return true;
  }

  if (role === '$none' && !appRole) {
    return true;
  }

  if (role === '$group:manager') {
    return groups.some((group) => group.role === 'Manager');
  }

  if (role === '$group:member') {
    return Boolean(groups.some((group) => group.role));
  }

  if (!appMemberRole) {
    return false;
  }

  if (securityDefinition.roles[appMemberRole].inherits) {
    return securityDefinition.roles[appMemberRole].inherits.some((inheritedRole) =>
      checkAppRole(securityDefinition, role, inheritedRole, groups),
    );
  }

  return false;
}
