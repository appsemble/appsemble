import { Button, Icon } from '@appsemble/react-components';
import type { PageDefinition } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { NavLink, useRouteMatch } from 'react-router-dom';

import { useAppDefinition } from '../AppDefinitionProvider';
import { useAppMessages } from '../AppMessagesProvider';
import { SideMenu } from '../SideMenu';
import { useUser } from '../UserProvider';
import styles from './index.css';
import { messages } from './messages';

interface SideNavigationProps {
  pages: PageDefinition[];
}

/**
 * The app navigation that is displayed in the side menu.
 */
export function SideNavigation({ pages }: SideNavigationProps): ReactElement {
  const { url } = useRouteMatch();
  const { getMessage } = useAppMessages();
  const {
    definition: { layout, security: showLogin },
  } = useAppDefinition();
  const { isLoggedIn, logout } = useUser();

  return (
    <SideMenu>
      <nav>
        <ul className={`menu-list ${styles.menuList}`}>
          {pages.map((page, index) => {
            const name = getMessage({
              id: `pages.${index}`,
              defaultMessage: page.name,
            }).format() as string;

            return (
              <li key={page.name}>
                <NavLink activeClassName={styles.active} to={`${url}/${normalize(name)}`}>
                  {page.icon ? <Icon className={styles.icon} icon={page.icon} /> : null}
                  <span>{name}</span>
                </NavLink>
              </li>
            );
          })}
          {layout?.settings === 'navigation' && (
            <li>
              <NavLink activeClassName={styles.active} to={`${url}/Settings`}>
                <Icon className={styles.icon} icon="wrench" />
                <span>
                  <FormattedMessage {...messages.settings} />
                </span>
              </NavLink>
            </li>
          )}

          {showLogin && layout?.login === 'navigation' && (
            <li>
              {isLoggedIn ? (
                <Button className={styles.button} icon="sign-out-alt" onClick={logout}>
                  <FormattedMessage {...messages.logout} />
                </Button>
              ) : (
                <NavLink to={`${url}/Login`}>
                  <Icon className={styles.icon} icon="sign-in-alt" />
                  <FormattedMessage {...messages.login} />
                </NavLink>
              )}
            </li>
          )}
        </ul>
      </nav>
    </SideMenu>
  );
}
