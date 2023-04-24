import { type AppDefinition, type TeamMember } from '@appsemble/types';
import { checkAppRole } from '@appsemble/utils';

export function shouldShowMenu(app: AppDefinition, userRole: string, teams: TeamMember[]): boolean {
  return (
    app.pages.filter((page) => {
      if (page.hideNavTitle) {
        return false;
      }
      if (page.parameters) {
        return false;
      }
      const roles = page.roles || app.roles || [];
      if (!roles.length) {
        return true;
      }
      return roles.some((r) => checkAppRole(app.security, r, userRole, teams));
    }).length > 1 ||
    app.layout?.feedback === 'navigation' ||
    app.layout?.login === 'navigation' ||
    app.layout?.settings === 'navigation'
  );
}
