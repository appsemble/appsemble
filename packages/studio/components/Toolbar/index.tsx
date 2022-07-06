import { SideMenuButton } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { useIntl } from 'react-intl';
import { Link, useRouteMatch } from 'react-router-dom';

import pkg from '../../package.json';
import { ProfileDropdown } from '../ProfileDropdown';
import styles from './index.module.css';
import { LanguageDropdown } from './LanguageDropdown';
import { messages } from './messages';

export function Toolbar(): ReactElement {
  const { formatMessage } = useIntl();
  const { url } = useRouteMatch();

  return (
    <nav className={`navbar is-fixed-top is-dark is-flex ${styles.root}`}>
      <div className="navbar-brand">
        <SideMenuButton />
        <Link className={styles.logo} to={url}>
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
