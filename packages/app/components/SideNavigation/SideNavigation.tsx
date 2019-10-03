import { Icon } from '@appsemble/react-components';
import { App } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import classNames from 'classnames';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { NavLink, useLocation } from 'react-router-dom';

import { User } from '../../types';
import SideMenu from '../SideMenu';
import messages from './messages';
import styles from './SideNavigation.css';

export interface SideNavigationProps {
  app: App;
  closeMenu: () => void;
  logout: () => void;
  user: User;
}

/**
 * The app navigation that is displayed in the side menu.
 */
export default function SideNavigation({
  app,
  user,
  logout,
  closeMenu,
}: SideNavigationProps): React.ReactElement {
  const location = useLocation();

  const onLogout = (): void => {
    logout();
    closeMenu();
  };

  const currentPage = app.pages.find(p => normalize(p.name) === location.pathname.split('/')[1]);
  const navigation = (currentPage && currentPage.navigation) || app.navigation || 'left';
  if (navigation !== 'left') {
    return null;
  }

  return (
    <SideMenu>
      <nav>
        <ul className={classNames('menu-list', styles.menuList)}>
          {app.pages
            .filter(page => !page.parameters)
            .map(page => (
              <li key={page.name}>
                <NavLink activeClassName={styles.active} to={`/${normalize(page.name)}`}>
                  {page.icon ? <Icon className={styles.icon} icon={page.icon} /> : null}
                  <span>{page.name}</span>
                </NavLink>
              </li>
            ))}
        </ul>

        {user && (
          <ul className="menu-list">
            <li>
              <button className={styles.logoutButton} onClick={onLogout} type="button">
                <FormattedMessage {...messages.logout} />
              </button>
            </li>
          </ul>
        )}
      </nav>
    </SideMenu>
  );
}
