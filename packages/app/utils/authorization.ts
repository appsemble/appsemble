import {
  type AppDefinition,
  type AppRole,
  type BlockDefinition,
  getAppInheritedRoles,
  type PageDefinition,
  type Security,
  type TabsPageDefinition,
  type ViewRole,
} from '@appsemble/lang-sdk';
import { type AppMemberGroup } from '@appsemble/types';

const defaultAllowedPages = new Set(['Login', 'Register']);

function getAppMemberViewRoles(
  appSecurityDefinition: Security,
  appMemberRoles: AppRole[],
  appMemberSelectedGroup: AppMemberGroup,
): ViewRole[] {
  if (!appSecurityDefinition) {
    return [];
  }

  if (!appMemberRoles.length) {
    return ['$guest'];
  }

  if (appMemberSelectedGroup) {
    return getAppInheritedRoles(appSecurityDefinition, [appMemberSelectedGroup.role]);
  }

  return getAppInheritedRoles(appSecurityDefinition, appMemberRoles);
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
  if (pageDefinition.roles) {
    return checkAppMemberViewRoles(pageDefinition.roles, appMemberViewRoles);
  }
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
  appMemberRoles: AppRole[],
  appMemberSelectedGroup: AppMemberGroup,
): boolean {
  if (defaultAllowedPages.has(pageDefinition.name)) {
    return true;
  }

  if (appDefinition.security && !appDefinition.security.guest && !appMemberRoles.length) {
    return false;
  }

  const appMemberViewRoles = getAppMemberViewRoles(
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    appDefinition.security,
    appMemberRoles,
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
  appMemberRoles: AppRole[],
  appMemberSelectedGroup?: AppMemberGroup,
): boolean {
  const appMemberViewRoles = getAppMemberViewRoles(
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    appDefinition.security,
    appMemberRoles,
    appMemberSelectedGroup,
  );

  const blockRoles = blockDefinition.roles || [];

  return checkAppMemberViewRoles(blockRoles, appMemberViewRoles);
}
