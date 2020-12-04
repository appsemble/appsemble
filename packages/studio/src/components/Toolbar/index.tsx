import classNames from 'classnames';
import React, { ReactElement } from 'react';
import { useIntl } from 'react-intl';
import { Link, useLocation, useRouteMatch } from 'react-router-dom';

import { supportedLanguages } from '../../utils/constants';
import { ProfileDropdown } from '../ProfileDropdown';
import styles from './index.css';
import { messages } from './messages';

export function Toolbar(): ReactElement {
  const { formatMessage } = useIntl();
  const {
    params: { lang },
    url,
  } = useRouteMatch<{ lang: string }>();
  const { pathname } = useLocation();

  return (
    <nav className={`navbar is-fixed-top is-dark is-flex ${styles.root}`}>
      <div className="navbar-brand">
        <Link to={url}>
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
      <div className="navbar-menu">
        <div className="navbar-end">
          <div className="navbar-item has-dropdown is-hoverable">
            <div className="navbar-link">{lang.split('-')[0].toUpperCase()}</div>
            <div className="navbar-dropdown">
              {Object.entries(supportedLanguages).map(([language, name]) => (
                <Link
                  className={classNames(['navbar-item px-2', { 'is-active': language === lang }])}
                  key={language}
                  to={pathname.replace(lang, language)}
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>
          <div className="navbar-item is-paddingless px-1">
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </nav>
  );
}
