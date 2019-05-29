import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { version } from '../../package.json';
import styles from './Toolbar.css';
import messages from './messages';

export default class Toolbar extends React.Component {
  static propTypes = {
    intl: PropTypes.shape().isRequired,
    isLoggedIn: PropTypes.bool.isRequired,
    logout: PropTypes.func.isRequired,
  };

  render() {
    const { intl, isLoggedIn, logout } = this.props;

    return (
      <nav className={`navbar is-fixed-top is-dark ${styles.root}`}>
        <div className="navbar-brand">
          <Link to="/">
            <header className="navbar-item title">
              <img
                alt={intl.formatMessage(messages.iconAlt)}
                className={styles.icon}
                src="/icon-64.png"
              />
              <h1 className="has-text-white title">Appsemble</h1>
            </header>
          </Link>
          <a
            className={`is-rounded is-warning tag ${styles.tag}`}
            href={`https://gitlab.com/appsemble/appsemble/tags/${version}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            {`alpha ${version}`}
          </a>
        </div>
        <div className="navbar-brand">
          <span className="navbar-item">
            <a
              className="button"
              href="https://appsemble.dev"
              rel="noopener noreferrer"
              target="_blank"
            >
              <FormattedMessage {...messages.docsLink} />
            </a>
          </span>
        </div>
        <div className="navbar-brand">
          {isLoggedIn && (
            <span className="navbar-item">
              <button className="button" onClick={logout} type="button">
                <span className="icon">
                  <i className="fas fa-sign-out-alt" />
                </span>
                <span>
                  <FormattedMessage {...messages.logoutButton} />
                </span>
              </button>
            </span>
          )}
        </div>
      </nav>
    );
  }
}
