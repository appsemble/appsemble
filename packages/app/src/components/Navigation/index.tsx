import type { PageDefinition } from '@appsemble/types';
import { checkAppRole, normalize } from '@appsemble/utils';
import React from 'react';
import { useLocation } from 'react-router-dom';

import { useAppDefinition } from '../AppDefinitionProvider';
import BottomNavigation from '../BottomNavigation';
import SideNavigation from '../SideNavigation';
import { useUser } from '../UserProvider';

/**
 * A wrapper component for determining type of navigation to display.
 *
 * Also handles filtering pages based on accessibility.
 */
export default function Navigation(): React.ReactElement {
  const { definition } = useAppDefinition();
  const { role } = useUser();
  const location = useLocation();

  const currentPage = definition.pages.find(
    (p) => normalize(p.name) === location.pathname.split('/')[1],
  );

  const navigation = currentPage?.navigation || definition.navigation || 'left-menu';
  const checkPagePermissions = (page: PageDefinition): boolean => {
    const roles = page.roles || definition.roles || [];
    return roles.length === 0 || roles.some((r) => checkAppRole(definition.security, r, role));
  };

  const pages = definition.pages.filter(
    (page) => !page.parameters && !page.hideFromMenu && checkPagePermissions(page),
  );

  switch (navigation) {
    case 'bottom':
      return <BottomNavigation pages={pages} />;
    case 'hidden':
      return null;

    case 'left-menu':
    default:
      return <SideNavigation pages={pages} />;
  }
}
