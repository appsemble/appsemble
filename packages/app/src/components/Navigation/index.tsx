import { PageDefinition } from '@appsemble/types';
import { checkAppRole } from '@appsemble/utils';
import React, { ReactElement } from 'react';

import { useAppDefinition } from '../AppDefinitionProvider';
import { BottomNavigation } from '../BottomNavigation';
import { SideNavigation } from '../SideNavigation';
import { useUser } from '../UserProvider';

/**
 * A wrapper component for determining type of navigation to display.
 *
 * Also handles filtering pages based on accessibility.
 */
export function Navigation(): ReactElement {
  const { definition } = useAppDefinition();
  const { role, teams } = useUser();

  const navigation = definition?.layout?.navigation || 'left-menu';
  const checkPagePermissions = (page: PageDefinition): boolean => {
    const roles = page.roles || definition.roles || [];

    return (
      roles.length === 0 || roles.some((r) => checkAppRole(definition.security, r, role, teams))
    );
  };

  const pages = definition.pages.filter(
    (page) => !page.parameters && !page.hideFromMenu && checkPagePermissions(page),
  );

  switch (navigation) {
    case 'bottom':
      return <BottomNavigation pages={pages} />;
    case 'hidden':
      return null;
    default:
      return <SideNavigation pages={pages} />;
  }
}
