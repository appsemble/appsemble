import { Icon } from '@appsemble/react-components';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import generateGravatarHash from '../../utils/generateGravatarHash';
import messages from './messages';
import styles from './ProfileDropdown.css';

export default class ProfileDropdown extends Component {
  node = React.createRef();

  static propTypes = {
    intl: PropTypes.shape().isRequired,
    logout: PropTypes.func.isRequired,
    user: PropTypes.shape().isRequired,
  };

  state = {
    open: false,
  };

  componentDidMount() {
    document.addEventListener('click', this.onOutsideClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onOutsideClick);
  }

  onOutsideClick = event => {
    if (this.node.current.contains(event.target)) {
      return;
    }

    this.setState({ open: false });
  };

  onClick = () => {
    this.setState(({ open }) => {
      return { open: !open };
    });
  };

  onKeyDown = event => {
    if (event.key === 'Escape') {
      this.setState({ open: false });
    }
  };

  render() {
    const { logout, user, intl } = this.props;
    const { open } = this.state;

    return (
      <div ref={this.node}>
        <div className={classNames('dropdown', 'is-right', { 'is-active': open })}>
          <div className="dropdown-trigger">
            <button aria-haspopup className="button" onClick={this.onClick} type="button">
              <figure className="image is-32x32">
                <img
                  alt={intl.formatMessage(messages.pfp)}
                  className={`is-rounded ${styles.gravatar}`}
                  src={generateGravatarHash(user.primaryEmail || user.id)}
                />
              </figure>
              <Icon icon="angle-down" size="small" />
            </button>
          </div>
          <div
            className="dropdown-menu"
            onClick={this.onClick}
            onKeyDown={this.onKeyDown}
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
}
