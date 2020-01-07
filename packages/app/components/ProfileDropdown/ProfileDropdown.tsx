import { Dropdown, Icon } from '@appsemble/react-components';
import { AppDefinition } from '@appsemble/types';
import generateGravatarHash from '@appsemble/utils/generateGravatarHash';
import React from 'react';
import { FormattedMessage, WrappedComponentProps } from 'react-intl';
import { Link } from 'react-router-dom';

import { User } from '../../types';
import messages from './messages';
import styles from './ProfileDropdown.css';

export type ProfileDropDownProps = {
  definition: AppDefinition;
  logout: () => void;
  user: User;
} & WrappedComponentProps;

export default function ProfileDropdown({
  definition,
  intl,
  logout,
  user,
}: ProfileDropDownProps): JSX.Element {
  const showSettings = definition.notifications !== undefined;
  const showLogin = definition.security;

  if (!showSettings && !showLogin) {
    return null;
  }

  if (!user) {
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
            src={generateGravatarHash(user.primaryEmail || `${user.id}`)}
          />
        </figure>
      }
    >
      <div className="dropdown-content">
        {showSettings && (
          <Link className="dropdown-item" to="/Settings">
            <Icon icon="wrench" />
            <span>
              <FormattedMessage {...messages.settings} />
            </span>
          </Link>
        )}
        {showSettings && showLogin && <hr className="dropdown-divider" />}
        {showLogin && (
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
        )}
      </div>
    </Dropdown>
  );
}
