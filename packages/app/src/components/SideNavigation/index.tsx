import { Icon } from '@appsemble/react-components';
import type { PageDefinition } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import React from 'react';
import { NavLink } from 'react-router-dom';

import SideMenu from '../SideMenu';
import styles from './index.css';

interface SideNavigationProps {
  pages: PageDefinition[];
}

/**
 * The app navigation that is displayed in the side menu.
 */
export default function SideNavigation({ pages }: SideNavigationProps): React.ReactElement {
  return (
    <SideMenu>
      <nav>
        <ul className={`menu-list ${styles.menuList}`}>
          {pages.map((page) => (
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
