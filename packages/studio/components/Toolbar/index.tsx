import { SideMenuButton } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import styles from './index.module.css';
import { LanguageDropdown } from './LanguageDropdown/index.js';
import { messages } from './messages.js';
import pkg from '../../package.json' with { type: 'json' };
import { ProfileDropdown } from '../ProfileDropdown/index.js';

export function Toolbar(): ReactNode {
  const { formatMessage } = useIntl();

  return (
    <nav className={`navbar is-fixed-top is-dark is-flex ${styles.root}`}>
      <div className="navbar-brand">
        <SideMenuButton />
        <Link className={styles.logo} to="">
          <header className="navbar-item">
            <img alt={formatMessage(messages.iconAlt)} className="mr-2" src="/icon-64.png" />
            <h4 className="has-text-white title">Appsemble</h4>
          </header>
        </Link>
        <a
          className={`is-rounded is-warning tag mx-1 my-1 ${styles.tag}`}
          href={`https://gitlab.com/appsemble/appsemble/-/releases/${pkg.version}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {pkg.version}
        </a>
      </div>

      <div className={`navbar-end ${styles.dropdowns}`}>
        <LanguageDropdown className={styles.dropdown} />
        <ProfileDropdown className={styles.dropdown} />
      </div>
    </nav>
  );
}
