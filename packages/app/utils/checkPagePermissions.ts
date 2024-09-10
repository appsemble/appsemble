import {
  type AppDefinition,
  type PageDefinition,
  type TabsPageDefinition,
  type GroupMember,
} from '@appsemble/types';
import { checkAppRole } from '@appsemble/utils';

function isAllowed(
  p: TabsPageDefinition,
  definition: AppDefinition,
  role: string,
  groups: GroupMember[],
): boolean {
  if (Array.isArray(p.tabs)) {
    return p.tabs.some((tab) => {
      const roles = tab.roles || p.roles || definition.roles || [];
      return (
        roles.length === 0 || roles.some((r) => checkAppRole(definition.security, r, role, groups))
      );
    });
  }
  const roles = p.definition.foreach.roles || p.roles || definition.roles || [];
  return roles.length === 0 || roles.some((r) => checkAppRole(definition.security, r, role, groups));
}

export function checkPagePermissions(
  p: PageDefinition,
  definition: AppDefinition,
  role: string,
  groups: GroupMember[],
): boolean {
  // Users should always be able to access custom login and register pages.
  if (p.name === 'Login' || p.name === 'Register') {
    return true;
  }

  if (p.type === 'tabs') {
    return isAllowed(p, definition, role, groups);
  }

  const roles = p.roles || definition.roles || [];

  return roles.length === 0 || roles.some((r) => checkAppRole(definition.security, r, role, groups));
}
