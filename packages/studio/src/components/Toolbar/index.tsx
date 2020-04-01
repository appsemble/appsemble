import React from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import { version } from '../../../package.json';
import ProfileDropdown from '../ProfileDropdown';
import styles from './index.css';
import messages from './messages';

export default function Toolbar(): React.ReactElement {
  const intl = useIntl();

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
          href={`https://gitlab.com/appsemble/appsemble/releases/${version}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {`alpha ${version}`}
        </a>
      </div>
      <div className="navbar-brand">
        <div className="navbar-item">
          <ProfileDropdown />
        </div>
      </div>
    </nav>
  );
}
