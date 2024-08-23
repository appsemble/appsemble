import { type AppDefinition, type PageDefinition, type TeamMember } from '@appsemble/types';
import { checkAppRole } from '@appsemble/utils';

function shouldShowPage(
  app: AppDefinition,
  page: PageDefinition,
  userRole: string,
  teams: TeamMember[],
): boolean {
  if (page.hideNavTitle) {
    return false;
  }
  if (page.parameters) {
    return false;
  }
  const roles = page.roles || app.roles || [];
  if (roles.length && !roles.some((r) => checkAppRole(app.security, r, userRole, teams))) {
    return false;
  }

  if (page.type === 'container' && page.pages) {
    for (const nestedPage of page.pages) {
      if (shouldShowPage(app, nestedPage, userRole, teams)) {
        return true;
      }
    }
    return false;
  }

  return true;
}

export function shouldShowMenu(app: AppDefinition, userRole: string, teams: TeamMember[]): boolean {
  let visiblePagesCount = 0;

  for (const page of app.pages) {
    if (shouldShowPage(app, page, userRole, teams)) {
      visiblePagesCount += 1;
    }
    if (visiblePagesCount > 1) {
      break;
    }
  }

  return (
    visiblePagesCount > 1 ||
    app.layout?.feedback === 'navigation' ||
    app.layout?.login === 'navigation' ||
    app.layout?.settings === 'navigation'
  );
}
