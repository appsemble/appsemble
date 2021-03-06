import { Portal, SideMenuButton } from '@appsemble/react-components';
import { ReactChild, ReactElement } from 'react';

import { shouldShowMenu } from '../../utils/layout';
import { useAppDefinition } from '../AppDefinitionProvider';
import { usePage } from '../MenuProvider';
import { ProfileDropdown } from '../ProfileDropdown';
import { useUser } from '../UserProvider';
import styles from './index.module.css';

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
  const { role, teams } = useUser();
  const { page } = usePage();

  const navigation = (page?.navigation || definition?.layout?.navigation) ?? 'left-menu';

  return (
    <Portal element={document.getElementsByClassName('navbar')[0]}>
      <div className={`is-flex ${styles.container}`}>
        {navigation === 'left-menu' && shouldShowMenu(definition, role, teams) && (
          <div className="navbar-brand">
            <span>
              <SideMenuButton />
            </span>
          </div>
        )}
        <div className={`navbar-brand ${styles.title}`}>
          <h2 className="navbar-item title is-4">{children || definition.name}</h2>
        </div>
        {(definition.layout?.login == null || definition.layout?.login === 'navbar') && (
          <div className={`navbar-end ${styles.dropdownContainer}`}>
            <div className="navbar-item is-paddingless px-1">
              <ProfileDropdown />
            </div>
          </div>
        )}
      </div>
    </Portal>
  );
}
