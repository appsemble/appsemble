import { type AppDefinition, type AppRole, type PageDefinition } from '@appsemble/lang-sdk';
import { type AppMemberGroup } from '@appsemble/types';

import { checkPagePermissions } from './authorization.js';

function shouldShowPage(
  appDefinition: AppDefinition,
  pageDefinition: PageDefinition,
  appMemberRole: AppRole,
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
  if (!checkPagePermissions(pageDefinition, appDefinition, appMemberRole, appMemberSelectedGroup)) {
    return false;
  }

  if (pageDefinition.type === 'container' && pageDefinition.pages) {
    for (const nestedPage of pageDefinition.pages) {
      if (shouldShowPage(appDefinition, nestedPage, appMemberRole, appMemberSelectedGroup)) {
        return true;
      }
    }
    return false;
  }

  return true;
}

export function shouldShowMenu(
  appDefinition: AppDefinition,
  appMemberRole: AppRole,
  appMemberSelectedGroup: AppMemberGroup,
): boolean {
  let visiblePagesCount = 0;

  for (const pageDefinition of appDefinition.pages) {
    if (shouldShowPage(appDefinition, pageDefinition, appMemberRole, appMemberSelectedGroup)) {
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
    appDefinition.layout?.settings === 'navigation'
  );
}
