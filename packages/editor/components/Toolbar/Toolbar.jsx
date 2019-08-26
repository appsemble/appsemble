import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { version } from '../../package.json';
import ProfileDropdown from '../ProfileDropdown';
import messages from './messages';
import styles from './Toolbar.css';

export default class Toolbar extends React.Component {
  static propTypes = {
    intl: PropTypes.shape().isRequired,
    isLoggedIn: PropTypes.bool.isRequired,
  };

  render() {
    const { intl, isLoggedIn } = this.props;

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
          <div className="navbar-item">
            {isLoggedIn ? (
              <ProfileDropdown />
            ) : (
              <Link className="button" to="/login">
                <FormattedMessage {...messages.login} />
              </Link>
            )}
          </div>
        </div>
      </nav>
    );
  }
}
