import { Icon } from '@appsemble/react-components';
import { AppDefinition } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { NavLink, useLocation } from 'react-router-dom';

import { User } from '../../types';
import SideMenu from '../SideMenu';
import messages from './messages';
import styles from './SideNavigation.css';

export interface SideNavigationProps {
  definition: AppDefinition;
  closeMenu: () => void;
  logout: () => void;
  user: User;
}

/**
 * The app navigation that is displayed in the side menu.
 */
export default function SideNavigation({
  definition,
  user,
  logout,
  closeMenu,
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

  const hideSettings = definition.notifications === undefined;

  return (
    <SideMenu>
      <nav>
        <ul className={`menu-list ${styles.menuList}`}>
          {definition.pages
            .filter(page => !page.parameters && !page.hideFromMenu)
            .map(page => (
              <li key={page.name}>
                <NavLink activeClassName={styles.active} to={`/${normalize(page.name)}`}>
                  {page.icon ? <Icon className={styles.icon} icon={page.icon} /> : null}
                  <span>{page.name}</span>
                </NavLink>
              </li>
            ))}
        </ul>

        <ul className={`menu-list ${styles.menuList}`}>
          {!hideSettings && (
            <li>
              <NavLink activeClassName={styles.active} to="/Settings">
                <Icon className={styles.icon} icon="cog" />
                <span>
                  <FormattedMessage {...messages.settings} />
                </span>
              </NavLink>
            </li>
          )}
          {user && (
            <li>
              <button className={styles.logoutButton} onClick={onLogout} type="button">
                <FormattedMessage {...messages.logout} />
              </button>
            </li>
          )}
        </ul>
      </nav>
    </SideMenu>
  );
}
