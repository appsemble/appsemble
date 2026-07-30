import {
  getPageDisplayName,
  getPagePathSegment,
  type PageDefinition,
  remap,
  type RemapperContext,
} from '@appsemble/lang-sdk';
import { Button, Icon } from '@appsemble/react-components';
import { type ReactNode, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { NavLink, useParams } from 'react-router-dom';
import { usePWAInstall } from 'react-use-pwa-install';

import styles from './index.module.css';
import { getNavPages, shouldShowPage } from '../../utils/layout.js';
import { appId, sentryDsn } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { useAppVariables } from '../AppVariablesProvider/index.js';
import { messages } from '../BottomNavigation/messages.js';

/**
 * The app navigation that is displayed as a horizontal bar in the title bar.
 *
 * On small screens the links collapse behind a hamburger menu, reusing Bulma's
 * native navbar behavior.
 */
export function TopNavigation(): ReactNode {
  const { lang } = useParams<{ lang: string }>();
  const url = `/${lang}`;
  const [active, setActive] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string>();

  const { definition } = useAppDefinition();
  const { appMemberInfo, appMemberRoles, appMemberSelectedGroup, isLoggedIn, logout } =
    useAppMember();
  const { getAppMessage, getMessage } = useAppMessages();
  const { getVariable } = useAppVariables();
  const { formatMessage } = useIntl();
  const install = usePWAInstall();

  const pages = useMemo(
    () => getNavPages(definition, appMemberRoles, appMemberSelectedGroup),
    [definition, appMemberRoles, appMemberSelectedGroup],
  );

  const createRemapperContext = (name: string): RemapperContext =>
    ({
      appId,
      appUrl: window.location.origin,
      url: window.location.href,
      group: appMemberSelectedGroup,
      getMessage,
      getVariable,
      appMemberInfo,
      context: { name },
      locale: lang!,
    }) satisfies RemapperContext;

  const getNavName = (page: PageDefinition): ReactNode => {
    const name = getPageDisplayName(page, getAppMessage);
    return page.navTitle
      ? (remap(page.navTitle, null, createRemapperContext(name)) as ReactNode)
      : name;
  };

  const closeMenu = (): void => {
    setActive(false);
    setOpenDropdown(undefined);
  };

  const renderLink = (page: PageDefinition): ReactNode => {
    const navName = getNavName(page);
    const count = page.badgeCount
      ? (remap(page.badgeCount, null, createRemapperContext(navName as string)) as number)
      : undefined;

    return (
      <NavLink
        className={({ isActive }) => `navbar-item ${isActive ? styles.active : ''}`}
        key={page.name}
        onClick={closeMenu}
        title={navName as string}
        to={`${url}/${getPagePathSegment(page)}`}
      >
        {page.icon ? <Icon icon={page.icon} /> : null}
        <span>{navName}</span>
        {count ? <span className="tag is-rounded ml-1 is-success">{count}</span> : null}
      </NavLink>
    );
  };

  const renderItem = (page: PageDefinition): ReactNode => {
    if (page.type === 'container') {
      const navName = getNavName(page);
      const children = page.pages.filter((child) =>
        shouldShowPage(definition, child, appMemberRoles, appMemberSelectedGroup),
      );
      if (children.length === 0) {
        return null;
      }
      const isOpen = openDropdown === page.name;

      return (
        <div
          className={`navbar-item has-dropdown is-hoverable ${isOpen ? 'is-active' : ''}`}
          key={page.name}
        >
          <button
            aria-expanded={isOpen}
            className={`navbar-link ${styles.dropdownButton}`}
            onClick={() => setOpenDropdown((open) => (open === page.name ? undefined : page.name))}
            type="button"
          >
            {page.icon ? <Icon icon={page.icon} /> : null}
            <span>{navName}</span>
          </button>
          <div className="navbar-dropdown">{children.map((child) => renderLink(child))}</div>
        </div>
      );
    }
    return renderLink(page);
  };

  return (
    <>
      <button
        aria-expanded={active}
        aria-label="menu"
        className={`navbar-burger ${active ? 'is-active' : ''}`}
        onClick={() => setActive((open) => !open)}
        type="button"
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
      <div className={`navbar-menu ${styles.menu} ${active ? 'is-active' : ''}`}>
        <div className="navbar-start">
          {pages.map((page) => renderItem(page))}

          {definition.layout?.settings === 'navigation' ? (
            <NavLink
              className="navbar-item"
              onClick={closeMenu}
              title={formatMessage(messages.settings)}
              to={`${url}/Settings`}
            >
              <Icon icon="wrench" />
              <span>
                <FormattedMessage {...messages.settings} />
              </span>
            </NavLink>
          ) : null}
          {definition.layout?.feedback === 'navigation' && sentryDsn ? (
            <NavLink
              className="navbar-item"
              onClick={closeMenu}
              title={formatMessage(messages.feedback)}
              to={`${url}/Feedback`}
            >
              <Icon icon="comment" />
              <span>
                <FormattedMessage {...messages.feedback} />
              </span>
            </NavLink>
          ) : null}
          {definition.layout?.install === 'navigation' && install ? (
            <Button
              className="navbar-item"
              icon="download"
              onClick={install}
              title={formatMessage(messages.install)}
            >
              <FormattedMessage {...messages.install} />
            </Button>
          ) : null}
          {definition.layout?.debug === 'navigation' ? (
            <NavLink
              className="navbar-item"
              onClick={closeMenu}
              title={formatMessage(messages.debug)}
              to={`${url}/Debug`}
            >
              <Icon icon="bug" />
              <span>
                <FormattedMessage {...messages.debug} />
              </span>
            </NavLink>
          ) : null}
          {definition.security && definition.layout?.login === 'navigation' ? (
            isLoggedIn ? (
              <Button
                className="navbar-item"
                icon="sign-out-alt"
                onClick={logout}
                title={formatMessage(messages.logout)}
              >
                <FormattedMessage {...messages.logout} />
              </Button>
            ) : (
              <NavLink
                className="navbar-item"
                onClick={closeMenu}
                title={formatMessage(messages.login)}
                to={`${url}/Login`}
              >
                <Icon icon="sign-in-alt" />
                <span>
                  <FormattedMessage {...messages.login} />
                </span>
              </NavLink>
            )
          ) : null}
        </div>
      </div>
    </>
  );
}
