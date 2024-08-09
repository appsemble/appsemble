import {
  type AppDefinition,
  type AppMemberGroup,
  type AppRole,
  type BlockDefinition,
  type PageDefinition,
  type Security,
  type TabsPageDefinition,
  type ViewRole,
} from '@appsemble/types';
import { getAppInheritedRoles } from '@appsemble/utils';

const defaultAllowedPages = new Set(['Login', 'Register']);

function getAppMemberViewRoles(
  appSecurityDefinition: Security,
  appMemberRole: AppRole,
  appMemberGroups: AppMemberGroup[],
): Set<AppRole> {
  if (!appSecurityDefinition) {
    return new Set();
  }

  return new Set<AppRole>([
    ...getAppInheritedRoles(appSecurityDefinition, appMemberRole ? [appMemberRole] : []),
    ...appMemberGroups.map(({ appMemberGroupRole }) => appMemberGroupRole),
  ]);
}

function checkAppMemberViewRoles(
  requiredRoles: ViewRole[],
  appMemberViewRoles: Set<AppRole>,
): boolean {
  return (
    requiredRoles.length === 0 ||
    requiredRoles.includes('$public') ||
    (requiredRoles.includes('$none') && !appMemberViewRoles.size) ||
    requiredRoles.some((requiredRole) => appMemberViewRoles.has(requiredRole))
  );
}

function checkTabPagePermissions(
  pageDefinition: TabsPageDefinition,
  appDefinition: AppDefinition,
  appMemberViewRoles: Set<AppRole>,
): boolean {
  if (Array.isArray(pageDefinition.tabs)) {
    return pageDefinition.tabs.some((tab) => {
      const tabRoles = tab.roles || [];
      return checkAppMemberViewRoles(tabRoles, appMemberViewRoles);
    });
  }

  const pageRoles = pageDefinition.definition.foreach.roles || [];

  return checkAppMemberViewRoles(pageRoles, appMemberViewRoles);
}

export function checkPagePermissions(
  pageDefinition: PageDefinition,
  appDefinition: AppDefinition,
  appMemberRole: AppRole,
  appMemberGroups: AppMemberGroup[],
): boolean {
  // Users should always be able to access custom login and register pages.
  if (defaultAllowedPages.has(pageDefinition.name)) {
    return true;
  }

  const appMemberViewRoles = getAppMemberViewRoles(
    appDefinition.security,
    appMemberRole,
    appMemberGroups,
  );

  if (pageDefinition.type === 'tabs') {
    return checkTabPagePermissions(pageDefinition, appDefinition, appMemberViewRoles);
  }

  const pageRoles = pageDefinition.roles || [];

  return checkAppMemberViewRoles(pageRoles, appMemberViewRoles);
}

export function checkBlockPermissions(
  blockDefinition: BlockDefinition,
  appDefinition: AppDefinition,
  appMemberRole: AppRole,
  appMemberGroups: AppMemberGroup[],
): boolean {
  const appMemberViewRoles = getAppMemberViewRoles(
    appDefinition.security,
    appMemberRole,
    appMemberGroups,
  );

  const blockRoles = blockDefinition.roles || [];

  return checkAppMemberViewRoles(blockRoles, appMemberViewRoles);
}
