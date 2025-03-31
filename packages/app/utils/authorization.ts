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
  appMemberSelectedGroup: AppMemberGroup,
): ViewRole[] {
  if (!appSecurityDefinition) {
    return [];
  }

  if (!appMemberRole) {
    return ['$guest'];
  }

  if (appMemberSelectedGroup) {
    return getAppInheritedRoles(appSecurityDefinition, [appMemberSelectedGroup.role]);
  }

  return getAppInheritedRoles(appSecurityDefinition, [appMemberRole]);
}

function checkAppMemberViewRoles(
  requiredRoles: ViewRole[],
  appMemberViewRoles: AppRole[],
): boolean {
  return (
    requiredRoles.length === 0 ||
    requiredRoles.some((requiredRole) => appMemberViewRoles.includes(requiredRole))
  );
}

function checkTabPagePermissions(
  pageDefinition: TabsPageDefinition,
  appDefinition: AppDefinition,
  appMemberViewRoles: AppRole[],
): boolean {
  if (Array.isArray(pageDefinition.tabs)) {
    return pageDefinition.tabs.some((tab) => {
      const tabRoles = tab.roles || [];
      return checkAppMemberViewRoles(tabRoles, appMemberViewRoles);
    });
  }

  const pageRoles = pageDefinition.definition?.foreach.roles || [];

  return checkAppMemberViewRoles(pageRoles, appMemberViewRoles);
}

export function checkPagePermissions(
  pageDefinition: PageDefinition,
  appDefinition: AppDefinition,
  appMemberRole: AppRole,
  appMemberSelectedGroup: AppMemberGroup,
): boolean {
  // Users should always be able to access custom login and register pages.
  if (defaultAllowedPages.has(pageDefinition.name)) {
    return true;
  }

  if (appDefinition.security && !appDefinition.security.guest && !appMemberRole) {
    return false;
  }

  const appMemberViewRoles = getAppMemberViewRoles(
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    appDefinition.security,
    appMemberRole,
    appMemberSelectedGroup,
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
  appMemberSelectedGroup?: AppMemberGroup,
): boolean {
  const appMemberViewRoles = getAppMemberViewRoles(
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    appDefinition.security,
    appMemberRole,
    appMemberSelectedGroup,
  );

  const blockRoles = blockDefinition.roles || [];

  return checkAppMemberViewRoles(blockRoles, appMemberViewRoles);
}
