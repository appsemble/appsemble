import { Icon } from '@appsemble/react-components';
import { App } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import * as React from 'react';
import { NavLink } from 'react-router-dom';

import styles from './BottomNavigation.css';

export interface BottomNavigationProps {
  app: App;
  children: React.ReactChild;
}

export default class BottomNavigation extends React.Component<BottomNavigationProps> {
  render(): JSX.Element {
    const { app } = this.props;

    if (app.navigation !== 'bottom') {
      return null;
    }

    return (
      <nav className="bottom-nav">
        <ul className={styles.list}>
          {app.pages
            .filter(page => !page.parameters)
            .map(page => (
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
}
