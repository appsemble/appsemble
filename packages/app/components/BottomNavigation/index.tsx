import { normalize, remap } from '@appsemble/lang-sdk';
import { Button, Icon } from '@appsemble/react-components';
import { type PageDefinition } from '@appsemble/types';
import { type ReactNode, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { NavLink, useParams } from 'react-router-dom';
import { usePWAInstall } from 'react-use-pwa-install';

import './index.css';
import styles from './index.module.css';
import { messages } from './messages.js';
import { shouldShowMenu } from '../../utils/layout.js';
import { appId, sentryDsn } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { useAppVariables } from '../AppVariablesProvider/index.js';

interface BottomNavigationProps {
  readonly pages: PageDefinition[];
}

/**
 * The app navigation that is displayed at the bottom of the app.
 */
export function BottomNavigation({ pages }: BottomNavigationProps): ReactNode {
  const { lang } = useParams<{ lang: string }>();
  const url = `/${lang}`;
  const { appMemberInfo, appMemberRole, appMemberSelectedGroup, isLoggedIn, logout } =
    useAppMember();
  const { getAppMessage, getMessage } = useAppMessages();
  const { getVariable } = useAppVariables();
  const { definition } = useAppDefinition();
  const { formatMessage } = useIntl();
  const install = usePWAInstall();

  const showMenu = useMemo(
    () => shouldShowMenu(definition, appMemberRole, appMemberSelectedGroup),
    [definition, appMemberRole, appMemberSelectedGroup],
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
            const remapperContext = {
              appId,
              appUrl: window.location.origin,
              url: window.location.href,
              getMessage,
              getVariable,
              appMemberInfo,
              context: { name },
              locale: lang,
            };
            // @ts-expect-error 2345 argument of type is not assignable to parameter of type
            // (strictNullChecks)
            // eslint-disable-next-line prettier/prettier
            const navName = page.navTitle ? (remap(page.navTitle, null, remapperContext) as ReactNode) : name;

            // @ts-expect-error 2345 argument of type is not assignable to parameter of type
            // (strictNullChecks)
            const count = remap(page.badgeCount, null, remapperContext) as number;

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
                    <div>
                      <Icon className="mb-1" icon={page.icon} iconSize="3x" size="large" />
                      {page.badgeCount ? (
                        <span className="tag is-rounded ml-1 is-success is-pulled-right">
                          {count}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <div>
                    <span>{navName}</span>
                    {page.badgeCount && !page.icon ? (
                      <span className="tag is-rounded ml-1 is-success">{count}</span>
                    ) : null}
                  </div>
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
          {definition.layout?.install === 'navigation' && install ? (
            <li className="bottom-nav-item">
              <Button
                className="bottom-nav-item-button is-flex-direction-column is-flex px-4 py-4 has-text-centered"
                icon="download"
                iconSize="large"
                iconSizeModifier="3x"
                onClick={install}
                title={formatMessage(messages.install)}
              >
                <FormattedMessage {...messages.install} />
              </Button>
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
