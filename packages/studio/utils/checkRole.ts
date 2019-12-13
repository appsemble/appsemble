import { Permission, Role, roles } from '@appsemble/utils';

export default function checkRole(role: keyof Role, permission: Permission): boolean {
  return roles[role].includes(permission);
}
