import { type AppDefinition, type GroupMember, type PageDefinition } from '@appsemble/types';
import { type AppRole } from '@appsemble/utils';

import { checkPagePermissions } from './authorization.js';

function shouldShowPage(
  appDefinition: AppDefinition,
  pageDefinition: PageDefinition,
  appMemberRole: AppRole,
  appMemberGroups: GroupMember[],
): boolean {
  if (pageDefinition.hideNavTitle) {
    return false;
  }
  if (pageDefinition.parameters) {
    return false;
  }
  if (!checkPagePermissions(pageDefinition, appDefinition, appMemberRole, appMemberGroups)) {
    return false;
  }

  if (pageDefinition.type === 'container' && pageDefinition.pages) {
    for (const nestedPage of pageDefinition.pages) {
      if (shouldShowPage(appDefinition, nestedPage, appMemberRole, appMemberGroups)) {
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
  appMemberGroups: GroupMember[],
): boolean {
  let visiblePagesCount = 0;

  for (const pageDefinition of appDefinition.pages) {
    if (shouldShowPage(appDefinition, pageDefinition, appMemberRole, appMemberGroups)) {
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
