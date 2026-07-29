import { type AppDefinition, type AppRole, type PageDefinition } from '@appsemble/lang-sdk';
import { type AppMemberGroup } from '@appsemble/types';

import { checkPagePermissions } from './authorization.js';

export function shouldShowPage(
  appDefinition: AppDefinition,
  pageDefinition: PageDefinition,
  appMemberRoles: AppRole[],
  appMemberSelectedGroup: AppMemberGroup,
): boolean {
  if (pageDefinition.hideNavTitle) {
    return false;
  }
  if (pageDefinition.parameters) {
    return false;
  }
  if (pageDefinition.navigation === 'hidden' || pageDefinition.navigation === 'profileDropdown') {
    return false;
  }
  if (
    !checkPagePermissions(pageDefinition, appDefinition, appMemberRoles, appMemberSelectedGroup)
  ) {
    return false;
  }

  if (pageDefinition.type === 'container' && pageDefinition.pages) {
    for (const nestedPage of pageDefinition.pages) {
      if (shouldShowPage(appDefinition, nestedPage, appMemberRoles, appMemberSelectedGroup)) {
        return true;
      }
    }
    return false;
  }

  return true;
}

const builtInPages = new Set([
  'Settings',
  'debug',
  'Login',
  'Register',
  'Group-Invite',
  'App-Invite',
  'Reset-Password',
  'Edit-Password',
  'Verify',
  'Callback',
  'Feedback',
]);

function isBuiltInPage(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments.at(-1)!;
  return builtInPages.has(lastSegment);
}

export function shouldHideGroupDropdown(
  hideGroupDropdown: boolean | AppRole[] | undefined,
  appMemberRoles: AppRole[],
): boolean {
  if (hideGroupDropdown === true) {
    return true;
  }
  if (Array.isArray(hideGroupDropdown)) {
    return appMemberRoles.some((role) => hideGroupDropdown.includes(role));
  }
  return false;
}

/**
 * Get the top-level pages that should be rendered in the app navigation.
 *
 * @param appDefinition The app definition to read the pages from.
 * @param appMemberRoles The roles of the current app member.
 * @param appMemberSelectedGroup The group the current app member has selected.
 * @returns The pages that are visible in the navigation.
 */
export function getNavPages(
  appDefinition: AppDefinition,
  appMemberRoles: AppRole[],
  appMemberSelectedGroup: AppMemberGroup,
): PageDefinition[] {
  return appDefinition.pages.filter((page) => {
    if (!shouldShowPage(appDefinition, page, appMemberRoles, appMemberSelectedGroup)) {
      return false;
    }

    return (
      page.type !== 'container' ||
      page.pages.some((child) =>
        shouldShowPage(appDefinition, child, appMemberRoles, appMemberSelectedGroup),
      )
    );
  });
}

export function shouldShowMenu(
  appDefinition: AppDefinition,
  appMemberRoles: AppRole[],
  appMemberSelectedGroup: AppMemberGroup,
  pathname?: string,
): boolean {
  if (pathname && isBuiltInPage(pathname)) {
    return true;
  }

  let visiblePagesCount = 0;

  for (const pageDefinition of appDefinition.pages) {
    if (shouldShowPage(appDefinition, pageDefinition, appMemberRoles, appMemberSelectedGroup)) {
      visiblePagesCount += 1;
    }
    if (visiblePagesCount > 1) {
      break;
    }
  }

  return (
    visiblePagesCount > 1 ||
    appDefinition.layout?.feedback === 'navigation' ||
    appDefinition.layout?.login === 'navigation' ||
    appDefinition.layout?.settings === 'navigation' ||
    appDefinition.layout?.install === 'navigation' ||
    appDefinition.layout?.debug === 'navigation'
  );
}
