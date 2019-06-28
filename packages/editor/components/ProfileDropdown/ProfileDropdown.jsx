import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import generateGravatarHash from '../../utils/generateGravatarHash';
import messages from './messages';
import styles from './ProfileDropdown.css';

export default class ProfileDropdown extends Component {
  static propTypes = {
    intl: PropTypes.shape().isRequired,
    logout: PropTypes.func.isRequired,
    user: PropTypes.shape().isRequired,
  };

  state = {
    open: false,
  };

  componentDidMount() {}

  toggleDropdown = () => {
    const { open } = this.state;
    this.setState({ open: !open });
  };

  closeDropdown = () => {
    this.setState({ open: false });
  };

  render() {
    const { logout, user } = this.props;
    const { open } = this.state;

    return (
      <React.Fragment>
        <div className={classNames('dropdown', 'is-right', { 'is-active': open })}>
          <div className="dropdown-trigger">
            <button
              aria-controls="dropdown-menu"
              aria-haspopup="true"
              className="button"
              onClick={this.toggleDropdown}
              type="button"
            >
              <figure className="image is-32x32">
                <img
                  alt="profile"
                  className={`is-rounded ${styles.gravatar}`}
                  src={generateGravatarHash(user.primaryEmail || user.id)}
                />
              </figure>
              <span className="icon is-small">
                <i aria-hidden="true" className="fas fa-angle-down" />
              </span>
            </button>
          </div>
          <div
            className="dropdown-menu"
            id="dropdown-menu"
            onClick={this.closeDropdown}
            onKeyDown={this.closeDropdown}
            role="menu"
            tabIndex={0}
          >
            <div className="dropdown-content">
              <Link className="dropdown-item" to="/_/settings">
                <span className="icon">
                  <i className="fas fa-wrench" />
                </span>
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
                <span className="icon">
                  <i className="fas fa-book" />
                </span>
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
                <span className={`icon ${styles.logoutButtonIcon}`}>
                  <i className="fas fa-sign-out-alt" />
                </span>
                <span>
                  <FormattedMessage {...messages.logoutButton} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}
