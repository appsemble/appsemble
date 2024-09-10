import { type GroupMember, type Security } from '@appsemble/types';

/**
 * Check if the given user has access to any of the given scopes.
 *
 * @param securityDefinition The security definition to use for checking the role.
 * @param role The role the user is checked against.
 * @param appMemberRole The role the app member has.
 * @param groups The groups the user is in.
 * @returns Whether or not the user has the role.
 */
export function checkAppRole(
  securityDefinition: Security,
  role: string,
  appMemberRole: string,
  groups: Pick<GroupMember, 'role'>[],
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
