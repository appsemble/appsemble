import { Icon } from '@appsemble/react-components';
import { AppDefinition } from '@appsemble/types';
import generateGravatarHash from '@appsemble/utils/generateGravatarHash';
import classNames from 'classnames';
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

  const hideSettings = definition.notifications === undefined;

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
            {hideSettings && (
              <>
                <Link className="dropdown-item" to="/Settings">
                  <Icon icon="wrench" />
                  <span>
                    <FormattedMessage {...messages.settings} />
                  </span>
                </Link>
                <hr className="dropdown-divider" />
              </>
            )}
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
