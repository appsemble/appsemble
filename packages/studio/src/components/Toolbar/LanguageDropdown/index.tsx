import { NavbarDropdown, NavbarItem } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { useLocation, useRouteMatch } from 'react-router-dom';

import { supportedLanguages } from '../../../utils/constants';

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
    <NavbarDropdown className={className} color="dark" label={lang.split('-')[0].toUpperCase()}>
      {Object.entries(supportedLanguages).map(([language, name]) => (
        <NavbarItem key={language} to={pathname.replace(lang, language)}>
          {name}
        </NavbarItem>
      ))}
    </NavbarDropdown>
  );
}
