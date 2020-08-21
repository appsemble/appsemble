import { Icon } from '@appsemble/react-components';
import type { PageDefinition } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import React, { ReactElement } from 'react';
import { NavLink, useRouteMatch } from 'react-router-dom';

import styles from './index.css';

interface BottomNavigationProps {
  pages: PageDefinition[];
}

/**
 * The app navigation that is displayed at the bottom of the app.
 */
export function BottomNavigation({ pages }: BottomNavigationProps): ReactElement {
  const { url } = useRouteMatch();

  return (
    <nav className="bottom-nav mb-0">
      <ul className={`${styles.list} is-flex`}>
        {pages.map((page) => (
          <li className="bottom-nav-item" key={page.name}>
            <NavLink
              activeClassName="is-active"
              className="bottom-nav-item-link is-flex px-4 py-4 has-text-centered"
              to={`${url}/${normalize(page.name)}`}
            >
              {page.icon ? (
                <Icon className="mb-1" icon={page.icon} iconSize="3x" size="large" />
              ) : null}
              <span>{page.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
