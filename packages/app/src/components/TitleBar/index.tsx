import { Portal } from '@appsemble/react-components';
import React, { ReactChild, ReactElement } from 'react';

import { shouldShowMenu } from '../../utils/layout';
import { useAppDefinition } from '../AppDefinitionProvider';
import { ProfileDropdown } from '../ProfileDropdown';
import { SideMenuButton } from '../SideMenuButton';
import { useUser } from '../UserProvider';
import styles from './index.css';

interface TitleBarProps {
  children?: ReactChild;
}

/**
 * The title bar on the top of the page.
 *
 * This displays the app name,
 */
export function TitleBar({ children }: TitleBarProps): ReactElement {
  const { definition } = useAppDefinition();
  const { role } = useUser();

  return (
    <Portal element={document.getElementsByClassName('navbar')[0]}>
      <div className={`is-flex ${styles.container}`}>
        {!(definition.navigation || definition.navigation === 'left-menu') &&
          shouldShowMenu(definition, role) && (
            <div className="navbar-brand">
              <span>
                <SideMenuButton />
              </span>
            </div>
          )}
        <div className={`navbar-brand ${styles.title}`}>
          <h2 className="navbar-item title is-4">{children || definition.name}</h2>
        </div>
        <div className="navbar-brand">
          <div className="navbar-item is-paddingless px-1">
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </Portal>
  );
}
