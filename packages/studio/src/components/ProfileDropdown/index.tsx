import { Button, Icon, useLocationString, useQuery } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useLocation, useRouteMatch } from 'react-router-dom';

import { sentryDsn } from '../../utils/settings';
import { NavbarDropdown } from '../NavbarDropdown';
import { useUser } from '../UserProvider';
import styles from './index.css';
import { messages } from './messages';

interface LanguageDropdownProps {
  /**
   * An optional class name to add to the root element.
   */
  className?: string;
}

export function ProfileDropdown({ className }: LanguageDropdownProps): ReactElement {
  const { formatMessage } = useIntl();
  const { logout, userInfo } = useUser();
  const location = useLocation();
  const redirect = useLocationString();
  const { url } = useRouteMatch();
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
      label={
        userInfo ? (
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
        ) : (
          <span>
            <FormattedMessage {...messages.login} />
          </span>
        )
      }
    >
      {userInfo && (
        <Link className="navbar-item" to={`${url}/settings`}>
          <Icon icon="wrench" />
          <span>
            <FormattedMessage {...messages.settings} />
          </span>
        </Link>
      )}
      <Link className="navbar-item" to={`${url}/blocks`}>
        <Icon icon="cubes" />
        <span>
          <FormattedMessage {...messages.blocks} />
        </span>
      </Link>
      <Link className="navbar-item" to={`${url}/docs`}>
        <Icon icon="book" />
        <span>
          <FormattedMessage {...messages.documentation} />
        </span>
      </Link>
      {sentryDsn && (
        <Link className="navbar-item" to={`${url}/feedback`}>
          <Icon icon="comment" />
          <span>
            <FormattedMessage {...messages.feedback} />
          </span>
        </Link>
      )}
      <hr className="navbar-divider" />
      {userInfo ? (
        <Button
          className={`navbar-item pl-5 ${styles.logoutButton}`}
          icon="sign-out-alt"
          onClick={logout}
        >
          <FormattedMessage {...messages.logoutButton} />
        </Button>
      ) : (
        <Link className="navbar-item" to={{ pathname: `${url}/login`, search: `?${search}` }}>
          <Icon icon="sign-in-alt" />
          <span>
            <FormattedMessage {...messages.login} />
          </span>
        </Link>
      )}
    </NavbarDropdown>
  );
}
