import {
  getPageDisplayName,
  getPagePathSegment,
  getRouteSegment,
  type PageDefinition,
} from '@appsemble/lang-sdk';
import { NavbarItem } from '@appsemble/react-components';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { usePWAInstall } from 'react-use-pwa-install';

import { checkPagePermissions } from '../../utils/authorization.js';
import { demoMode, displayAppMemberName, sentryDsn, showDemoLogin } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { messages } from '../ProfileDropdown/messages.js';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider/index.js';

interface ProfileMenu {
  readonly isLoggedIn: boolean;

  /**
   * The path of the login page, linked to instead of the menu items while logged out.
   */
  readonly loginPath: string;

  /**
   * The name of the logged in app member, if the app displays it.
   */
  readonly memberName?: string;
}

/**
 * Determine whether the profile menu is shown for the current page and app member.
 *
 * @returns The profile menu to render, or `undefined` if the app shows none.
 */
export function useProfileMenu(): ProfileMenu | undefined {
  const { definition } = useAppDefinition();
  const { getAppMessage } = useAppMessages();
  const { appMemberInfo, isLoggedIn } = useAppMember();
  const { lang } = useParams<{ lang: string }>();
  const { pathname } = useLocation();

  const showLogin = definition.security && Object.hasOwn(definition.security, 'roles');
  const { layout } = definition;
  const loginSegment = getRouteSegment('Login', getAppMessage);

  if (
    !showLogin ||
    pathname.includes(`${lang}/${loginSegment}`) ||
    (layout?.login != null && layout?.login !== 'navbar')
  ) {
    return undefined;
  }

  return {
    isLoggedIn,
    loginPath: `/${lang}/${loginSegment}`,
    memberName:
      !demoMode && displayAppMemberName && appMemberInfo
        ? appMemberInfo.name || appMemberInfo.email
        : undefined,
  };
}

interface ProfileMenuItemsProps {
  /**
   * Called when the change role item is clicked. The caller renders the `DemoLogin` modal, so it
   * stays visible when the menu containing the items closes.
   */
  readonly onDemoLogin: () => void;

  /**
   * Called when any item is clicked.
   */
  readonly onNavigate?: () => void;
}

/**
 * The items of the profile menu of a logged in app member, rendered as Bulma navbar items.
 */
export function ProfileMenuItems({ onDemoLogin, onNavigate }: ProfileMenuItemsProps): ReactNode {
  const { definition } = useAppDefinition();
  const navigate = useNavigate();
  const { getAppMessage } = useAppMessages();
  const { appMemberRoles, appMemberSelectedGroup, logout } = useAppMember();
  const { lang } = useParams<{ lang: string }>();
  const { update } = useServiceWorkerRegistration();
  const install = usePWAInstall();

  const onClickPageName = useCallback(
    (page: PageDefinition) => navigate(`/${lang}/${getPagePathSegment(page, getAppMessage)}`),
    [getAppMessage, navigate, lang],
  );

  const select = (action: () => unknown) => (): void => {
    onNavigate?.();
    action();
  };

  const { layout } = definition;
  const enabledSettings = layout?.enabledSettings;
  const pages = definition.pages.filter(
    (page) =>
      page.navigation === 'profileDropdown' &&
      checkPagePermissions(page, definition, appMemberRoles, appMemberSelectedGroup),
  );
  const showSettings =
    (layout?.settings ?? 'navbar') === 'navbar' &&
    (enabledSettings?.length || definition.notifications === 'opt-in');
  const showFeedback = (layout?.feedback ?? 'navbar') === 'navbar' && sentryDsn;
  const showInstall = (layout?.install ?? 'navbar') === 'navbar' && install;
  const showDebug = (layout?.debug ?? 'hidden') === 'navbar';

  return (
    <>
      {showSettings ? (
        <NavbarItem
          icon="wrench"
          onClickCapture={onNavigate}
          to={`/${lang}/${getRouteSegment('Settings', getAppMessage)}`}
        >
          <FormattedMessage {...messages.settings} />
        </NavbarItem>
      ) : null}
      {showFeedback ? (
        <>
          {showSettings ? <hr className="navbar-divider" /> : null}
          <NavbarItem
            icon="comment"
            onClickCapture={onNavigate}
            to={`/${lang}/${getRouteSegment('Feedback', getAppMessage)}`}
          >
            <FormattedMessage {...messages.feedback} />
          </NavbarItem>
        </>
      ) : null}
      {showDemoLogin ? (
        <>
          {showSettings || showFeedback ? <hr className="navbar-divider" /> : null}
          <NavbarItem dataTestId="change-role" onClick={select(onDemoLogin)}>
            <FormattedMessage {...messages.demoLogin} />
          </NavbarItem>
        </>
      ) : null}
      {showInstall ? (
        <>
          {showSettings || showFeedback || showDemoLogin ? <hr className="navbar-divider" /> : null}
          <NavbarItem dataTestId="install" onClick={select(install)}>
            <FormattedMessage {...messages.install} />
          </NavbarItem>
          <hr className="navbar-divider" />
          <NavbarItem dataTestId="update" onClick={select(update)}>
            <FormattedMessage {...messages.update} />
          </NavbarItem>
        </>
      ) : null}
      {showDebug ? (
        <>
          {showSettings || showFeedback || showDemoLogin || showInstall ? (
            <hr className="navbar-divider" />
          ) : null}
          <NavbarItem dataTestId="debug" onClickCapture={onNavigate} to={`/${lang}/Debug`}>
            <FormattedMessage {...messages.debug} />
          </NavbarItem>
        </>
      ) : null}
      {pages.map((page) => (
        <div key={page.name}>
          <hr className="navbar-divider" />
          <NavbarItem onClick={select(() => onClickPageName(page))}>
            {getPageDisplayName(page, getAppMessage)}
          </NavbarItem>
        </div>
      ))}
      {showSettings || showFeedback || showInstall ? <hr className="navbar-divider" /> : null}
      <NavbarItem icon="sign-out-alt" onClick={select(logout)}>
        <FormattedMessage {...messages.logoutButton} />
      </NavbarItem>
    </>
  );
}
