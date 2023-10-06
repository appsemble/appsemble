import { Icon, NavbarDropdown, NavbarItem, useToggle } from '@appsemble/react-components';
import { type ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useLocation, useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { sentryDsn, showDemoLogin } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { DemoLogin } from '../DemoLogin/index.js';
import { useUser } from '../UserProvider/index.js';

export function ProfileDropdown(): ReactElement {
  const { formatMessage } = useIntl();
  const { definition } = useAppDefinition();
  const { isLoggedIn, logout, userInfo } = useUser();
  const { lang } = useParams<{ lang: string }>();
  const { pathname } = useLocation();

  const showLogin = definition.security;
  const { layout } = definition;

  const demoLoginToggle = useToggle();

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

  return (
    <>
      <NavbarDropdown
        className={`is-right ${styles.dropdown}`}
        label={
          <figure className="image is-32x32 is-clipped">
            {userInfo?.picture ? (
              <img
                alt={formatMessage(messages.pfp)}
                className={`is-rounded ${styles.gravatar}`}
                src={userInfo.picture}
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
        {(layout?.settings ?? 'navbar') === 'navbar' && (
          <NavbarItem icon="wrench" to={`/${lang}/Settings`}>
            <FormattedMessage {...messages.settings} />
          </NavbarItem>
        )}
        {(layout?.feedback ?? 'navbar') === 'navbar' && sentryDsn ? (
          <NavbarItem icon="comment" to={`/${lang}/Feedback`}>
            <FormattedMessage {...messages.feedback} />
          </NavbarItem>
        ) : null}
        {showDemoLogin ? (
          <NavbarItem onClick={demoLoginToggle.enable}>
            <FormattedMessage {...messages.demoLogin} />
          </NavbarItem>
        ) : null}
        {showLogin ? (
          <>
            {layout?.settings === 'navbar' || layout?.feedback === 'navbar' ? (
              <hr className="navbar-divider" />
            ) : null}
            <NavbarItem icon="sign-out-alt" onClick={logout}>
              <FormattedMessage {...messages.logoutButton} />
            </NavbarItem>
          </>
        ) : null}
      </NavbarDropdown>
      <DemoLogin modal={demoLoginToggle} />
    </>
  );
}
