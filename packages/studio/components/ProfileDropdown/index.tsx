import {
  Icon,
  NavbarDropdown,
  NavbarItem,
  useLocationString,
  useQuery,
} from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { sentryDsn } from '../../utils/settings.js';
import { useUser } from '../UserProvider/index.js';

interface LanguageDropdownProps {
  /**
   * An optional class name to add to the root element.
   */
  readonly className?: string;
}

export function ProfileDropdown({ className }: LanguageDropdownProps): ReactNode {
  const { formatMessage } = useIntl();
  const { logout, userInfo } = useUser();
  const location = useLocation();
  const redirect = useLocationString();
  const qs = useQuery();
  let search: URLSearchParams;

  if (!userInfo) {
    if (location.pathname.endsWith('/login')) {
      return null;
    }

    search = new URLSearchParams(qs);
    search.set('redirect', redirect);
  }

  return (
    <NavbarDropdown
      className={`is-right ${className}`}
      color="dark"
      label={
        userInfo ? (
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
        ) : (
          <span>
            <FormattedMessage {...messages.login} />
          </span>
        )
      }
    >
      {userInfo ? (
        <NavbarItem icon="wrench" to="settings/user">
          <FormattedMessage {...messages.settings} />
        </NavbarItem>
      ) : null}
      {userInfo && sentryDsn ? <hr className="navbar-divider" /> : null}
      {sentryDsn ? (
        <NavbarItem icon="comment" to="feedback">
          <FormattedMessage {...messages.feedback} />
        </NavbarItem>
      ) : null}
      {userInfo || (!userInfo && sentryDsn) ? <hr className="navbar-divider" /> : null}
      {userInfo ? (
        <NavbarItem icon="sign-out-alt" onClick={logout}>
          <FormattedMessage {...messages.logoutButton} />
        </NavbarItem>
      ) : (
        <NavbarItem icon="sign-in-alt" to={{ pathname: 'login', search: `?${search}` }}>
          <FormattedMessage {...messages.login} />
        </NavbarItem>
      )}
    </NavbarDropdown>
  );
}
