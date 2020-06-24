import { Button, Dropdown, Icon, useLocationString, useQuery } from '@appsemble/react-components';
import * as React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useLocation } from 'react-router-dom';

import useUser from '../../hooks/useUser';
import styles from './index.css';
import messages from './messages';

export default function ProfileDropdown(): React.ReactElement {
  const { formatMessage } = useIntl();
  const { logout, userInfo } = useUser();
  const location = useLocation();
  const redirect = useLocationString();
  const qs = useQuery();
  let search: URLSearchParams;

  if (!userInfo) {
    if (location.pathname === '/login') {
      return null;
    }

    search = new URLSearchParams(qs);
    search.set('redirect', redirect);
  }

  return (
    <Dropdown
      className="is-right"
      label={
        userInfo ? (
          <figure className="image is-32x32">
            <img
              alt={formatMessage(messages.pfp)}
              className={`is-rounded ${styles.gravatar}`}
              src={userInfo.picture}
            />
          </figure>
        ) : (
          <span>
            <FormattedMessage {...messages.login} />
          </span>
        )
      }
    >
      {userInfo && (
        <Link className="dropdown-item" to="/settings">
          <Icon icon="wrench" />
          <span>
            <FormattedMessage {...messages.settings} />
          </span>
        </Link>
      )}
      <Link className="dropdown-item" to="/blocks">
        <Icon icon="cubes" />
        <span>
          <FormattedMessage {...messages.blocks} />
        </span>
      </Link>
      <a
        className="dropdown-item"
        href="https://appsemble.dev"
        rel="noopener noreferrer"
        target="_blank"
      >
        <Icon icon="book" />
        <span>
          <FormattedMessage {...messages.documentation} />
        </span>
      </a>
      <hr className="dropdown-divider" />
      {userInfo ? (
        <Button
          className={`dropdown-item ${styles.logoutButton}`}
          icon="sign-out-alt"
          onClick={logout}
        >
          <FormattedMessage {...messages.logoutButton} />
        </Button>
      ) : (
        <Link
          className={`button dropdown-item ${styles.logoutButton}`}
          to={{ pathname: '/login', search: `?${search}` }}
        >
          <Icon icon="sign-in-alt" />
          <span>
            <FormattedMessage {...messages.login} />
          </span>
        </Link>
      )}
    </Dropdown>
  );
}
