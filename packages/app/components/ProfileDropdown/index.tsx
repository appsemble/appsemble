import { normalize, type PageDefinition } from '@appsemble/lang-sdk';
import { Icon, NavbarDropdown, NavbarItem, useToggle } from '@appsemble/react-components';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { usePWAInstall } from 'react-use-pwa-install';

import styles from './index.module.css';
import { messages } from './messages.js';
import { checkPagePermissions } from '../../utils/authorization.js';
import { demoMode, displayAppMemberName, sentryDsn, showDemoLogin } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { DemoLogin } from '../DemoLogin/index.js';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider/index.js';

export function ProfileDropdown(): ReactNode {
  const { formatMessage } = useIntl();
  const { definition } = useAppDefinition();
  const navigate = useNavigate();
  const { getAppMessage } = useAppMessages();
  const { appMemberInfo, appMemberRole, appMemberSelectedGroup, isLoggedIn, logout } =
    useAppMember();
  const { lang } = useParams<{ lang: string }>();
  const { pathname } = useLocation();
  const { update } = useServiceWorkerRegistration();

  const showLogin = definition.security && Object.hasOwn(definition.security, 'roles');
  const { layout } = definition;
  const onClickPageName = useCallback(
    (page: PageDefinition) => navigate(`/${lang}/${normalize(page.name)}`),
    [navigate, lang],
  );
  const demoLoginToggle = useToggle();
  const install = usePWAInstall();

  if (
    !showLogin ||
    pathname.includes(`${lang}/Login`) ||
    (layout?.login != null && layout?.login !== 'navbar')
  ) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <div className="navbar-item is-paddingless">
        <Link className={styles.login} to={`/${lang}/Login`}>
          <div
            className={`is-flex is-justify-content-center is-align-items-center px-4 ${styles.loginText}`}
          >
            <FormattedMessage {...messages.login} />
          </div>
        </Link>
      </div>
    );
  }

  const showSettings = (layout?.settings ?? 'navbar') === 'navbar';
  const pages = definition.pages.filter(
    (page) =>
      page.navigation === 'profileDropdown' &&
      checkPagePermissions(page, definition, appMemberRole, appMemberSelectedGroup),
  );
  const showFeedback = (layout?.feedback ?? 'navbar') === 'navbar' && sentryDsn;
  const showInstall = (layout?.install ?? 'navbar') === 'navbar' && install;

  return (
    <>
      {!demoMode && displayAppMemberName && appMemberInfo ? (
        <span className="m-1 is-size-6 is-align-content-center">
          {appMemberInfo.name || appMemberInfo.email}
        </span>
      ) : null}
      <NavbarDropdown
        className={`is-right ${styles.dropdown}`}
        label={
          <figure className="image is-32x32 is-clipped">
            {appMemberInfo?.picture ? (
              <img
                alt={formatMessage(messages.pfp)}
                className={`is-rounded ${styles.gravatar}`}
                src={appMemberInfo.picture}
              />
            ) : (
              <Icon
                className={`is-rounded has-background-grey-dark has-text-white-ter ${styles.gravatarFallback}`}
                icon="user"
              />
            )}
          </figure>
        }
      >
        {showSettings ? (
          <NavbarItem icon="wrench" to={`/${lang}/Settings`}>
            <FormattedMessage {...messages.settings} />
          </NavbarItem>
        ) : null}
        {showFeedback ? (
          <>
            {showSettings ? <hr className="navbar-divider" /> : null}
            <NavbarItem icon="comment" to={`/${lang}/Feedback`}>
              <FormattedMessage {...messages.feedback} />
            </NavbarItem>
          </>
        ) : null}
        {showDemoLogin ? (
          <>
            {showSettings || showFeedback ? <hr className="navbar-divider" /> : null}
            <NavbarItem dataTestId="change-role" onClick={demoLoginToggle.enable}>
              <FormattedMessage {...messages.demoLogin} />
            </NavbarItem>
          </>
        ) : null}
        {showInstall ? (
          <>
            {showSettings || showFeedback || showDemoLogin ? (
              <hr className="navbar-divider" />
            ) : null}
            <>
              <NavbarItem dataTestId="install" onClick={install}>
                <FormattedMessage {...messages.install} />
              </NavbarItem>
              <hr className="navbar-divider" />
              <NavbarItem dataTestId="update" onClick={update}>
                <FormattedMessage {...messages.update} />
              </NavbarItem>
            </>
          </>
        ) : null}
        {pages?.length
          ? pages.map((page) => (
              <div key={page.name}>
                <hr className="navbar-divider" />
                <NavbarItem onClick={() => onClickPageName(page)}>
                  {getAppMessage({ id: `pages.${normalize(page.name)}` }).format()}
                </NavbarItem>
              </div>
            ))
          : null}
        {showLogin ? (
          <>
            {showSettings || showFeedback || showInstall ? <hr className="navbar-divider" /> : null}
            <NavbarItem icon="sign-out-alt" onClick={logout}>
              <FormattedMessage {...messages.logoutButton} />
            </NavbarItem>
          </>
        ) : null}
      </NavbarDropdown>
      {showDemoLogin ? <DemoLogin modal={demoLoginToggle} /> : null}
    </>
  );
}
