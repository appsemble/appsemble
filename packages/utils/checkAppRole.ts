import { type GroupMember, type Security } from '@appsemble/types';

/**
 * Check if the given user has access to any of the given scopes.
 *
 * @param securityDefinition The security definition to use for checking the role.
 * @param role The role the user is checked against.
 * @param appMemberRole
 * @param appRole The role the app member has.
 * @param groups The groups the user is in.
 * @returns Whether or not the user has the role.
 */
export function checkAppRole(
  securityDefinition: Security,
  appMemberRole: string,
  appRole: string,
  groups: Pick<GroupMember, 'role'>[],
): boolean {
  if (appMemberRole === appRole) {
    return true;
  }

  if (appMemberRole === '$public' && appRole) {
    return true;
  }

  if (appMemberRole === '$none' && !appRole) {
    return true;
  }

  if (appMemberRole === '$group:manager') {
    return groups.some((group) => group.role === 'Manager');
  }

  if (appMemberRole === '$group:member') {
    return Boolean(groups.some((group) => group.role));
  }

  if (!appMemberRole) {
    return false;
  }

  // If (securityDefinition.roles[appMemberRole].inherits) {
  //   return securityDefinition.roles[appMemberRole].inherits.some((inheritedRole) =>
  //     checkAppRole(securityDefinition, appMemberRole, inheritedRole, groups),
  //   );
  // }

  return false;
}
