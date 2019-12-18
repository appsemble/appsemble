import { AppDefinition } from '@appsemble/types';
import classNames from 'classnames';
import React from 'react';

import Portal from '../Portal';
import ProfileDropdown from '../ProfileDropdown';
import SideMenuButton from '../SideMenuButton';
import styles from './TitleBar.css';

export interface TitleBarProps {
  children: React.ReactChild;
  definition: AppDefinition;
}

/**
 * The title bar on the top of the page.
 *
 * This displays the app name,
 */
export default function TitleBar({ children }: TitleBarProps): React.ReactElement {
  return (
    <Portal element={document.getElementsByClassName('navbar')[0]}>
      <div className={styles.container}>
        <div className={classNames('navbar-brand', styles.brand)}>
          <span>
            <SideMenuButton />
          </span>
          <h2 className="navbar-item title is-4">{children}</h2>
        </div>
        <div className="navbar-brand">
          <div className="navbar-item">
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </Portal>
  );
}
