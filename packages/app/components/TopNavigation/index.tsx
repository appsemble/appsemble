import {
  getPageDisplayName,
  getPagePathSegment,
  getRouteSegment,
  type PageDefinition,
  remap,
  type RemapperContext,
} from '@appsemble/lang-sdk';
import { Button, Icon, NavbarBurger, useToggle } from '@appsemble/preact-components';
import { type ComponentChildren, type VNode } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { Link, useParams } from 'wouter-preact';

import styles from './index.module.css';
import { FormattedMessage, useIntl } from '../IntlProvider/index.js';
import { getNavPages, shouldShowPage } from '../../utils/layout.js';
import { appId, sentryDsn, showDemoLogin } from '../../utils/settings.js';
import { useActiveNavigation } from '../../utils/useActiveNavigation.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { useAppVariables } from '../AppVariablesProvider/index.js';
import { messages } from '../BottomNavigation/messages.js';
import { DemoLogin } from '../DemoLogin/index.js';
import { NavLink } from '../NavLink/index.js';
import { useIsDesktop } from '../PageGridProvider/index.js';
import { ProfileMenuItems, useProfileMenu } from '../ProfileMenu/index.js';
import { usePWAInstall } from '../../utils/usePWAInstall.js';

/**
 * The app navigation that is displayed as a horizontal bar in the title bar.
 *
 * On small screens the links collapse behind a hamburger menu, reusing Bulma's
 * native navbar behavior. Below the desktop breakpoint the menu also lists the
 * profile dropdown items, which the title bar hides there.
 */
export function TopNavigation(): VNode {
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
  const isDesktop = useIsDesktop(definition.layout?.breakpoints);
  const profileMenu = useProfileMenu();
  const showProfileMenu = profileMenu && !isDesktop;
  const demoLoginToggle = useToggle();

  const pages = useMemo(
    () => getNavPages(definition, appMemberRoles, appMemberSelectedGroup),
    [definition, appMemberRoles, appMemberSelectedGroup],
  );

  const getCurrent = useActiveNavigation(pages, true);

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

  const getNavName = (page: PageDefinition): ComponentChildren => {
    const name = getPageDisplayName(page, getAppMessage);
    return page.navTitle
      ? (remap(page.navTitle, null, createRemapperContext(name)) as ComponentChildren)
      : name;
  };

  const closeMenu = (): void => {
    setActive(false);
    setOpenDropdown(undefined);
  };

  const renderLink = (page: PageDefinition): VNode => {
    const navName = getNavName(page);
    const count = page.badgeCount
      ? (remap(page.badgeCount, null, createRemapperContext(navName as string)) as number)
      : undefined;
    const current = getCurrent(page);

    return (
      <Link
        aria-current={current}
        className={`navbar-item ${current ? styles.active : ''}`}
        key={page.name}
        onClick={closeMenu}
        title={navName as string}
        to={`${url}/${getPagePathSegment(page, getAppMessage)}`}
      >
        {page.icon ? <Icon icon={page.icon} /> : null}
        <span>{navName}</span>
        {count ? <span className="tag is-rounded ml-1 is-success">{count}</span> : null}
      </Link>
    );
  };

  const renderItem = (page: PageDefinition): VNode | null => {
    if (page.type === 'container') {
      const navName = getNavName(page);
      const children = page.pages.filter((child) =>
        shouldShowPage(definition, child, appMemberRoles, appMemberSelectedGroup),
      );
      if (children.length === 0) {
        return null;
      }
      const isOpen = openDropdown === page.name;
      const current = getCurrent(page);

      return (
        <div
          className={`navbar-item has-dropdown is-hoverable ${isOpen ? 'is-active' : ''}`}
          key={page.name}
        >
          <button
            aria-current={current}
            aria-expanded={isOpen}
            className={`navbar-link ${styles.dropdownButton} ${current ? styles.active : ''}`}
            onClick={() => setOpenDropdown((open) => (open === page.name ? undefined : page.name))}
            type="button"
          >
            {page.icon ? <Icon icon={page.icon} /> : null}
            <span>{navName}</span>
          </button>
          <div className="navbar-dropdown">{children.map((child) => renderItem(child))}</div>
        </div>
      );
    }
    return renderLink(page);
  };

  const loginLink = (
    <NavLink
      className="navbar-item"
      onClick={closeMenu}
      title={formatMessage(messages.login)}
      to={`${url}/${getRouteSegment('Login', getAppMessage)}`}
    >
      <Icon icon="sign-in-alt" />
      <span>
        <FormattedMessage {...messages.login} />
      </span>
    </NavLink>
  );

  return (
    <>
      <NavbarBurger
        active={active}
        aria-expanded={active}
        aria-label="menu"
        onClick={() => setActive((open) => !open)}
      />
      <div className={`navbar-menu ${styles.menu} ${active ? 'is-active' : ''}`}>
        <div className="navbar-start">
          {pages.map((page) => renderItem(page))}

          {definition.layout?.settings === 'navigation' ? (
            <NavLink
              className="navbar-item"
              onClick={closeMenu}
              title={formatMessage(messages.settings)}
              to={`${url}/${getRouteSegment('Settings', getAppMessage)}`}
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
              to={`${url}/${getRouteSegment('Feedback', getAppMessage)}`}
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
              loginLink
            )
          ) : null}
        </div>
        {showProfileMenu ? (
          <div className={`navbar-end ${styles.profileMenu}`}>
            <hr className="navbar-divider" />
            {profileMenu.isLoggedIn ? (
              <>
                {profileMenu.memberName ? (
                  <span className="navbar-item">{profileMenu.memberName}</span>
                ) : null}
                <ProfileMenuItems onDemoLogin={demoLoginToggle.enable} onNavigate={closeMenu} />
              </>
            ) : (
              loginLink
            )}
          </div>
        ) : null}
      </div>
      {showProfileMenu && showDemoLogin ? <DemoLogin modal={demoLoginToggle} /> : null}
    </>
  );
}
