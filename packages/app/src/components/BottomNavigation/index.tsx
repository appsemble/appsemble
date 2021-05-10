import { Icon } from '@appsemble/react-components';
import { PageDefinition } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import { ReactElement, useMemo } from 'react';
import { NavLink, useRouteMatch } from 'react-router-dom';

import { shouldShowMenu } from '../../utils/layout';
import { useAppDefinition } from '../AppDefinitionProvider';
import { useAppMessages } from '../AppMessagesProvider';
import { useUser } from '../UserProvider';
import styles from './index.module.css';
import './index.css';

interface BottomNavigationProps {
  pages: PageDefinition[];
}

/**
 * The app navigation that is displayed at the bottom of the app.
 */
export function BottomNavigation({ pages }: BottomNavigationProps): ReactElement {
  const { url } = useRouteMatch();
  const { teams } = useUser();
  const { getMessage } = useAppMessages();
  const { definition } = useAppDefinition();
  const { role } = useUser();

  const showMenu = useMemo(
    () => shouldShowMenu(definition, role, teams),
    [definition, role, teams],
  );

  return (
    showMenu && (
      <nav className="bottom-nav mb-0">
        <ul className={`${styles.list} is-flex`}>
          {pages.map((page, index) => {
            const name = getMessage({
              id: `pages.${index}`,
              defaultMessage: page.name,
            }).format() as string;

            return (
              <li className="bottom-nav-item" key={page.name}>
                <NavLink
                  activeClassName="is-active"
                  className="bottom-nav-item-link is-flex px-4 py-4 has-text-centered"
                  to={`${url}/${normalize(name)}`}
                >
                  {page.icon ? (
                    <Icon className="mb-1" icon={page.icon} iconSize="3x" size="large" />
                  ) : null}
                  <span>{name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    )
  );
}
