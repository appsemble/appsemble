import { Button, Icon } from '@appsemble/react-components';
import { type PageDefinition } from '@appsemble/types';
import { normalize, remap } from '@appsemble/utils';
import { type ReactElement, type ReactNode, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { NavLink, useParams } from 'react-router-dom';

import './index.css';
import styles from './index.module.css';
import { messages } from './messages.js';
import { shouldShowMenu } from '../../utils/layout.js';
import { appId, sentryDsn } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { useUser } from '../UserProvider/index.js';

interface BottomNavigationProps {
  readonly pages: PageDefinition[];
}

/**
 * The app navigation that is displayed at the bottom of the app.
 */
export function BottomNavigation({ pages }: BottomNavigationProps): ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const url = `/${lang}`;
  const { isLoggedIn, teams } = useUser();
  const { getAppMessage, getMessage } = useAppMessages();
  const { definition } = useAppDefinition();
  const { logout, role, userInfo } = useUser();
  const { formatMessage } = useIntl();

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
              id: `pages.${normalize(page.name)}`,
              defaultMessage: page.name,
            }).format() as string;
            const navName = page.navTitle
              ? (remap(page.navTitle, null, {
                  appId,
                  appUrl: window.location.origin,
                  url: window.location.href,
                  getMessage,
                  userInfo,
                  context: { name },
                  locale: lang,
                }) as ReactNode)
              : name;

            return (
              <li className="bottom-nav-item" key={page.name}>
                <NavLink
                  className={({ isActive }) =>
                    `bottom-nav-item-link is-flex px-4 py-4 has-text-centered ${
                      isActive && 'is-active'
                    }`
                  }
                  title={navName as string}
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
                className={({ isActive }) =>
                  `bottom-nav-item-link is-flex px-4 py-4 has-text-centered ${
                    isActive && 'is-active'
                  }`
                }
                title={formatMessage(messages.settings)}
                to={`${url}/Settings`}
              >
                <Icon className="mb-1" icon="wrench" iconSize="3x" size="large" />
                <span>
                  <FormattedMessage {...messages.settings} />
                </span>
              </NavLink>
            </li>
          )}
          {definition.layout?.feedback === 'navigation' && sentryDsn ? (
            <li className="bottom-nav-item">
              <NavLink
                className={({ isActive }) =>
                  `bottom-nav-item-link is-flex px-4 py-4 has-text-centered ${
                    isActive && 'is-active'
                  }`
                }
                title={formatMessage(messages.feedback)}
                to={`${url}/Feedback`}
              >
                <Icon className="mb-1" icon="comment" iconSize="3x" size="large" />
                <span>
                  <FormattedMessage {...messages.feedback} />
                </span>
              </NavLink>
            </li>
          ) : null}
          {definition.security && definition.layout?.login === 'navigation' ? (
            isLoggedIn ? (
              <li className="bottom-nav-item">
                <Button
                  className="bottom-nav-item-button is-flex-direction-column is-flex px-4 py-4 has-text-centered"
                  icon="sign-out-alt"
                  iconSize="large"
                  iconSizeModifier="3x"
                  onClick={logout}
                  title={formatMessage(messages.logout)}
                >
                  <FormattedMessage {...messages.logout} />
                </Button>
              </li>
            ) : (
              <li className="bottom-nav-item">
                <NavLink
                  className={({ isActive }) =>
                    `bottom-nav-item-link is-flex px-4 py-4 has-text-centered ${
                      isActive && 'is-active'
                    }`
                  }
                  title={formatMessage(messages.login)}
                  to={`${url}/Login`}
                >
                  <Icon className="mb-1" icon="sign-in-alt" iconSize="3x" size="large" />
                  <span>
                    <FormattedMessage {...messages.login} />
                  </span>
                </NavLink>
              </li>
            )
          ) : null}
        </ul>
      </nav>
    )
  );
}
