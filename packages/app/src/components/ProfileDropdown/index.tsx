import { Button, Dropdown, Icon } from '@appsemble/react-components';
import React, { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import { useAppDefinition } from '../AppDefinitionProvider';
import { useUser } from '../UserProvider';
import styles from './index.css';
import { messages } from './messages';

export function ProfileDropdown(): ReactElement {
  const { formatMessage } = useIntl();
  const { definition } = useAppDefinition();
  const { isLoggedIn, logout, userInfo } = useUser();

  const showLogin = definition.security;
  const { layout } = definition;

  if (!showLogin || (layout?.login != null && layout?.login !== 'navbar')) {
    return null;
  }

  if (!isLoggedIn) {
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
            alt={formatMessage(messages.pfp)}
            className={`is-rounded ${styles.gravatar}`}
            src={userInfo?.picture}
          />
        </figure>
      }
    >
      <Link className="dropdown-item" to="/Settings">
        <Icon icon="wrench" />
        <span>
          <FormattedMessage {...messages.settings} />
        </span>
      </Link>
      {showLogin && (
        <>
          <hr className="dropdown-divider" />
          <Button
            className={`dropdown-item pl-5 ${styles.logoutButton}`}
            icon="sign-out-alt"
            onClick={logout}
          >
            <FormattedMessage {...messages.logoutButton} />
          </Button>
        </>
      )}
    </Dropdown>
  );
}
