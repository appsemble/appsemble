import { Icon } from '@appsemble/react-components';
import { AppDefinition, Page } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { NavLink, useLocation } from 'react-router-dom';

import { User } from '../../types';
import checkAppRole from '../../utils/checkAppRole';
import SideMenu from '../SideMenu';
import messages from './messages';
import styles from './SideNavigation.css';

export interface SideNavigationProps {
  definition: AppDefinition;
  closeMenu: () => void;
  logout: () => void;
  user: User;
  role: string;
}

/**
 * The app navigation that is displayed in the side menu.
 */
export default function SideNavigation({
  definition,
  user,
  logout,
  closeMenu,
  role,
}: SideNavigationProps): React.ReactElement {
  const location = useLocation();

  const onLogout = (): void => {
    logout();
    closeMenu();
  };

  const currentPage = definition.pages.find(
    p => normalize(p.name) === location.pathname.split('/')[1],
  );

  const navigation =
    (currentPage && currentPage.navigation) || definition.navigation || 'left-menu';
  if (navigation !== 'left-menu') {
    return null;
  }

  const checkPagePermissions = (page: Page): boolean => {
    const roles = page.roles || definition.roles || [];
    return roles.length === 0 || roles.some(r => checkAppRole(definition.security, r, role));
  };

  return (
    <SideMenu>
      <nav>
        <ul className={`menu-list ${styles.menuList}`}>
          {definition.pages
            .filter(page => !page.parameters && !page.hideFromMenu && checkPagePermissions(page))
            .map(page => (
              <li key={page.name}>
                <NavLink activeClassName={styles.active} to={`/${normalize(page.name)}`}>
                  {page.icon ? <Icon className={styles.icon} icon={page.icon} /> : null}
                  <span>{page.name}</span>
                </NavLink>
              </li>
            ))}
        </ul>
      </nav>
    </SideMenu>
  );
}
