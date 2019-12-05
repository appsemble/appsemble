import { roles } from '@appsemble/utils/constants/roles';

export default function checkRole(role, permission) {
  return roles[role].includes(permission);
}
