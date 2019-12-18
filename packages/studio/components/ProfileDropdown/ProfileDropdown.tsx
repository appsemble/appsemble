import { Icon } from '@appsemble/react-components';
import generateGravatarHash from '@appsemble/utils/generateGravatarHash';
import classNames from 'classnames';
import React from 'react';
import { FormattedMessage, WrappedComponentProps } from 'react-intl';
import { Link } from 'react-router-dom';

import { User } from '../../types';
import messages from './messages';
import styles from './ProfileDropdown.css';

export type ProfileDropDownProps = {
  logout: () => void;
  user: User;
} & WrappedComponentProps;

export default function ProfileDropdown({ intl, logout, user }: ProfileDropDownProps): JSX.Element {
  const node = React.useRef<HTMLDivElement>();
  const [open, setOpen] = React.useState(false);

  const onOutsideClick = (event: MouseEvent): void => {
    if (node && node.current && node.current.contains(event.target as Node)) {
      return;
    }

    setOpen(false);
  };

  React.useEffect(() => {
    document.addEventListener('click', onOutsideClick);

    return () => {
      document.addEventListener('click', onOutsideClick);
    };
  });

  const onClick = (): void => {
    setOpen(!open);
  };

  const onKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  if (!user) {
    return (
      <Link className="button" to="/login">
        <FormattedMessage {...messages.login} />
      </Link>
    );
  }

  return (
    <div ref={node}>
      <div className={classNames('dropdown', 'is-right', { 'is-active': open })}>
        <div className="dropdown-trigger">
          <button aria-haspopup className="button" onClick={onClick} type="button">
            <figure className="image is-32x32">
              <img
                alt={intl.formatMessage(messages.pfp)}
                className={`is-rounded ${styles.gravatar}`}
                src={generateGravatarHash(user.primaryEmail || `${user.id}`)}
              />
            </figure>
            <Icon icon="angle-down" size="small" />
          </button>
        </div>
        <div
          className="dropdown-menu"
          onClick={onClick}
          onKeyDown={onKeyDown}
          role="menu"
          tabIndex={0}
        >
          <div className="dropdown-content">
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
          </div>
        </div>
      </div>
    </div>
  );
}
