import classNames from 'classnames';
import React, { ReactChild, ReactElement } from 'react';

import Portal from '../Portal';
import ProfileDropdown from '../ProfileDropdown';
import SideMenuButton from '../SideMenuButton';
import styles from './index.css';

interface TitleBarProps {
  children: ReactChild;
}

/**
 * The title bar on the top of the page.
 *
 * This displays the app name,
 */
export default function TitleBar({ children }: TitleBarProps): ReactElement {
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
