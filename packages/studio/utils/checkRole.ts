import { type Permissions, type Role, roles } from '@appsemble/utils';

export function checkRole(role: Role, permission: Permissions): boolean {
  if (!role) {
    return false;
  }

  return roles[role].includes(permission);
}
