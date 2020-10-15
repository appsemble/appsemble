import React, { ReactElement } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import { ProfileDropdown } from '../ProfileDropdown';
import styles from './index.css';
import { messages } from './messages';

export function Toolbar(): ReactElement {
  const { formatMessage } = useIntl();

  return (
    <nav className={`navbar is-fixed-top is-dark is-flex ${styles.root}`}>
      <div className="navbar-brand">
        <Link to="/">
          <header className="navbar-item">
            <img alt={formatMessage(messages.iconAlt)} className="mr-2" src="/icon-64.png" />
            <h4 className="has-text-white title">Appsemble</h4>
          </header>
        </Link>
        <a
          className={`is-rounded is-warning tag mx-1 my-1 ${styles.tag}`}
          href={`https://gitlab.com/appsemble/appsemble/-/releases/${process.env.APPSEMBLE_VERSION}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {`alpha ${process.env.APPSEMBLE_VERSION}`}
        </a>
      </div>
      <div className="navbar-brand">
        <div className="navbar-item is-paddingless px-1">
          <ProfileDropdown />
        </div>
      </div>
    </nav>
  );
}
