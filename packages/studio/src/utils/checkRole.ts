import { Permission, Role, roles } from '@appsemble/utils';

export function checkRole(role: Role, permission: Permission): boolean {
  if (!role) {
    return false;
  }

  return roles[role].includes(permission);
}
