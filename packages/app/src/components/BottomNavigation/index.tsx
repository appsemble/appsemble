import { Icon } from '@appsemble/react-components';
import type { PageDefinition } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import * as React from 'react';
import { NavLink } from 'react-router-dom';

import styles from './index.css';

interface BottomNavigationProps {
  pages: PageDefinition[];
}

/**
 * The app navigation that is displayed at the bottom of the app.
 */
export default function BottomNavigation({ pages }: BottomNavigationProps): React.ReactElement {
  return (
    <nav className="bottom-nav">
      <ul className={styles.list}>
        {pages.map((page) => (
          <li key={page.name} className="bottom-nav-item">
            <NavLink
              activeClassName="is-active"
              className="bottom-nav-item-link"
              to={`/${normalize(page.name)}`}
            >
              {page.icon ? <Icon icon={page.icon} iconSize="3x" size="large" /> : null}
              <span>{page.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
