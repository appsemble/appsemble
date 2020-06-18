import React from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import ProfileDropdown from '../ProfileDropdown';
import styles from './index.css';
import messages from './messages';

export default function Toolbar(): React.ReactElement {
  const intl = useIntl();

  return (
    <nav className={`navbar is-fixed-top is-dark ${styles.root}`}>
      <div className="navbar-brand">
        <Link to="/">
          <header className="navbar-item">
            <img
              alt={intl.formatMessage(messages.iconAlt)}
              className={styles.icon}
              src="/icon-64.png"
            />
            <h4 className="has-text-white title">Appsemble</h4>
          </header>
        </Link>
        <a
          className={`is-rounded is-warning tag ${styles.tag}`}
          href={`https://gitlab.com/appsemble/appsemble/-/releases/${process.env.APPSEMBLE_VERSION}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {`alpha ${process.env.APPSEMBLE_VERSION}`}
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
