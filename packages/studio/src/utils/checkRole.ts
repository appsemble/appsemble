import { Permission, Role, roles } from '@appsemble/utils';

export function checkRole(role: Role, permission: Permission): boolean {
  return roles[role].includes(permission);
}
