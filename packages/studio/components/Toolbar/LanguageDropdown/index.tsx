import { NavbarDropdown, NavbarItem } from '@appsemble/react-components';
import { type ReactElement } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import { supportedLanguages } from '../../../utils/constants.js';

interface LanguageDropdownProps {
  /**
   * An optional class name to add to the root element.
   */
  className?: string;
}

export function LanguageDropdown({ className }: LanguageDropdownProps): ReactElement {
  const { lang } = useParams<{ lang: string }>();
  const { hash, pathname, search } = useLocation();

  return (
    <NavbarDropdown className={className} color="dark" label={lang.split('-')[0].toUpperCase()}>
      {Object.entries(supportedLanguages).map(([language, name]) => (
        <NavbarItem
          key={language}
          to={{ pathname: pathname.replace(lang, language), hash, search }}
        >
          {name}
        </NavbarItem>
      ))}
    </NavbarDropdown>
  );
}
