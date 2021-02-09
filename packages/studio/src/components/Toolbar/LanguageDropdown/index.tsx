import classNames from 'classnames';
import React, { ReactElement } from 'react';
import { Link, useLocation, useRouteMatch } from 'react-router-dom';

import { supportedLanguages } from '../../../utils/constants';
import { NavbarDropdown } from '../../NavbarDropdown';

interface LanguageDropdownProps {
  /**
   * An optional class name to add to the root element.
   */
  className?: string;
}

export function LanguageDropdown({ className }: LanguageDropdownProps): ReactElement {
  const {
    params: { lang },
  } = useRouteMatch<{ lang: string }>();
  const { pathname } = useLocation();

  return (
    <NavbarDropdown className={className} label={lang.split('-')[0].toUpperCase()}>
      {Object.entries(supportedLanguages).map(([language, name]) => (
        <Link
          className={classNames(['navbar-item px-2', { 'is-active': language === lang }])}
          key={language}
          to={pathname.replace(lang, language)}
        >
          {name}
        </Link>
      ))}
    </NavbarDropdown>
  );
}
