import { NavbarDropdown, NavbarItem } from '@appsemble/react-components';
import { type ReactElement, useEffect, useState } from 'react';
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
  const [selectedLanguage, setSelectedLanguage] = useState(lang);

  useEffect(() => {
    localStorage.setItem('preferredLanguage', selectedLanguage);
  }, [selectedLanguage]);

  function handleLanguageChange(language: string): void {
    setSelectedLanguage(language);
    const newUrl = `${pathname.replace(lang, language)}${search}${hash}`;
    window.history.pushState(null, '', newUrl);
    window.dispatchEvent(new Event('popstate'));
  }

  return (
    <NavbarDropdown className={className} color="dark" label={lang.split('-')[0].toUpperCase()}>
      {Object.entries(supportedLanguages).map(([language, name]) => (
        <NavbarItem
          key={language}
          onClick={() => handleLanguageChange(language)}
          to={{ pathname: pathname.replace(lang, language), hash, search }}
        >
          {name}
        </NavbarItem>
      ))}
    </NavbarDropdown>
  );
}
