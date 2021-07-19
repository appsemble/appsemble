import { Icon, NavbarDropdown, NavbarItem } from '@appsemble/react-components';
import { sentryDsn } from 'app/src/utils/settings';
import { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useRouteMatch } from 'react-router-dom';

import { useAppDefinition } from '../AppDefinitionProvider';
import { useUser } from '../UserProvider';
import styles from './index.module.css';
import { messages } from './messages';

export function ProfileDropdown(): ReactElement {
  const { formatMessage } = useIntl();
  const { definition } = useAppDefinition();
  const { isLoggedIn, logout, userInfo } = useUser();
  const {
    params: { lang },
    path,
  } = useRouteMatch<{ lang: string }>();

  const showLogin = definition.security;
  const { layout } = definition;

  if (
    !showLogin ||
    path.includes(':lang/Login') ||
    (layout?.login != null && layout?.login !== 'navbar')
  ) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <Link className={`navbar-item ${styles.login}`} to={`/${lang}/Login`}>
        <FormattedMessage {...messages.login} />
      </Link>
    );
  }

  return (
    <NavbarDropdown
      className={`is-right ${styles.dropdown}`}
      label={
        <figure className="image is-32x32">
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
      {(layout?.feedback ?? 'navbar') === 'navbar' && sentryDsn && (
        <NavbarItem icon="comment" to={`/${lang}/Feedback`}>
          <FormattedMessage {...messages.feedback} />
        </NavbarItem>
      )}
      {showLogin && (
        <>
          <hr className="navbar-divider" />
          <NavbarItem icon="sign-out-alt" onClick={logout}>
            <FormattedMessage {...messages.logoutButton} />
          </NavbarItem>
        </>
      )}
    </NavbarDropdown>
  );
}
