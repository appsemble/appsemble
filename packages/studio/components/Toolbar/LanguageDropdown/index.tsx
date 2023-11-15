import { NavbarDropdown, NavbarItem } from '@appsemble/react-components';
import axios from 'axios';
import { type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { supportedLanguages } from '../../../utils/constants.js';
import { useUser } from '../../UserProvider/index.js';

interface LanguageDropdownProps {
  /**
   * An optional class name to add to the root element.
   */
  readonly className?: string;
}

export function LanguageDropdown({ className }: LanguageDropdownProps): ReactNode {
  const { lang } = useParams<{ lang: string }>();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { userInfo } = useUser();

  async function handleLanguageChange(language: string): Promise<void> {
    localStorage.setItem('preferredLanguage', language);
    if (userInfo) {
      userInfo.locale = language;
      await axios.put('/api/user', {
        name: userInfo.name,
        locale: language,
        timezone: userInfo.zoneinfo,
      });
    }
    navigate(pathname.replace(lang, language), { replace: true });
  }
  return (
    <NavbarDropdown className={className} color="dark" label={lang.split('-')[0].toUpperCase()}>
      {Object.entries(supportedLanguages).map(([language, name]) => (
        <NavbarItem key={language} onClick={() => handleLanguageChange(language)}>
          {name}
        </NavbarItem>
      ))}
    </NavbarDropdown>
  );
}
