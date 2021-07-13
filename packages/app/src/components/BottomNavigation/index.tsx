import { Button, Icon } from '@appsemble/react-components';
import { PageDefinition } from '@appsemble/types';
import { normalize, remap } from '@appsemble/utils';
import { ReactElement, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { NavLink, useRouteMatch } from 'react-router-dom';

import { shouldShowMenu } from '../../utils/layout';
import { appId } from '../../utils/settings';
import { useAppDefinition } from '../AppDefinitionProvider';
import { useAppMessages } from '../AppMessagesProvider';
import { useUser } from '../UserProvider';
import styles from './index.module.css';
import { messages } from './messages';
import './index.css';

interface BottomNavigationProps {
  pages: PageDefinition[];
}

/**
 * The app navigation that is displayed at the bottom of the app.
 */
export function BottomNavigation({ pages }: BottomNavigationProps): ReactElement {
  const { url } = useRouteMatch();
  const { isLoggedIn, teams } = useUser();
  const { getAppMessage, getMessage } = useAppMessages();
  const { definition } = useAppDefinition();
  const { logout, role, userInfo } = useUser();

  const showMenu = useMemo(
    () => shouldShowMenu(definition, role, teams),
    [definition, role, teams],
  );

  return (
    showMenu && (
      <nav className="bottom-nav mb-0">
        <ul className={`${styles.list} is-flex`}>
          {pages.map((page) => {
            const name = getAppMessage({
              id: `pages.${definition.pages.indexOf(page)}`,
              defaultMessage: page.name,
            }).format() as string;
            const navName = page.navTitle
              ? remap(page.navTitle, null, { appId, getMessage, userInfo, context: { name } })
              : name;

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
                  <span>{navName}</span>
                </NavLink>
              </li>
            );
          })}

          {definition.layout?.settings === 'navigation' && (
            <li className="bottom-nav-item">
              <NavLink
                activeClassName="is-active"
                className="bottom-nav-item-link is-flex px-4 py-4 has-text-centered"
                to={`${url}/Settings`}
              >
                <Icon className="mb-1" icon="wrench" iconSize="3x" size="large" />
                <span>
                  <FormattedMessage {...messages.settings} />
                </span>
              </NavLink>
            </li>
          )}
          {definition.layout?.feedback === 'navigation' && (
            <li className="bottom-nav-item">
              <NavLink
                activeClassName="is-active"
                className="bottom-nav-item-link is-flex px-4 py-4 has-text-centered"
                to={`${url}/Feedback`}
              >
                <Icon className="mb-1" icon="comment" iconSize="3x" size="large" />
                <span>
                  <FormattedMessage {...messages.settings} />
                </span>
              </NavLink>
            </li>
          )}
          {definition.security &&
            definition.layout?.login === 'navigation' &&
            (isLoggedIn ? (
              <li className="bottom-nav-item">
                <Button
                  className="bottom-nav-item-button is-flex-direction-column is-flex px-4 py-4 has-text-centered"
                  icon="sign-out-alt"
                  iconSize="large"
                  iconSizeModifier="3x"
                  onClick={logout}
                >
                  <FormattedMessage {...messages.logout} />
                </Button>
              </li>
            ) : (
              <li className="bottom-nav-item">
                <NavLink
                  activeClassName="is-active"
                  className="bottom-nav-item-link is-flex px-4 py-4 has-text-centered"
                  to={`${url}/Login`}
                >
                  <Icon className="mb-1" icon="sign-in-alt" iconSize="3x" size="large" />
                  <span>
                    <FormattedMessage {...messages.login} />
                  </span>
                </NavLink>
              </li>
            ))}
        </ul>
      </nav>
    )
  );
}
