import { Dropdown, Icon } from '@appsemble/react-components';
import * as React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import useUser from '../../hooks/useUser';
import messages from './messages';
import styles from './ProfileDropdown.css';

export default function ProfileDropdown(): React.ReactElement {
  const intl = useIntl();
  const { logout, userInfo } = useUser();

  if (!userInfo) {
    return (
      <Link className="button" to="/Login">
        <FormattedMessage {...messages.login} />
      </Link>
    );
  }

  return (
    <Dropdown
      className="is-right"
      label={
        <figure className="image is-32x32">
          <img
            alt={intl.formatMessage(messages.pfp)}
            className={`is-rounded ${styles.gravatar}`}
            src={userInfo.picture}
          />
        </figure>
      }
    >
      <Link className="dropdown-item" to="/settings">
        <Icon icon="wrench" />
        <span>
          <FormattedMessage {...messages.settings} />
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
      <button
        className={`button dropdown-item ${styles.logoutButton}`}
        onClick={logout}
        type="button"
      >
        <Icon className={styles.logoutButtonIcon} icon="sign-out-alt" size="small" />
        <span>
          <FormattedMessage {...messages.logoutButton} />
        </span>
      </button>
    </Dropdown>
  );
}
