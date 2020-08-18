import { Portal } from '@appsemble/react-components';
import React, { ReactChild, ReactElement } from 'react';

import { ProfileDropdown } from '../ProfileDropdown';
import { SideMenuButton } from '../SideMenuButton';
import styles from './index.css';

interface TitleBarProps {
  children: ReactChild;
}

/**
 * The title bar on the top of the page.
 *
 * This displays the app name,
 */
export function TitleBar({ children }: TitleBarProps): ReactElement {
  return (
    <Portal element={document.getElementsByClassName('navbar')[0]}>
      <div className={`is-flex ${styles.container}`}>
        <div className="navbar-brand">
          <span>
            <SideMenuButton />
          </span>
        </div>
        <div className={`navbar-brand ${styles.title}`}>
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
