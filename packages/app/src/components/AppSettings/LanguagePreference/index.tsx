import { Select } from '@appsemble/react-components';
import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { definition, languages } from '../../../utils/settings';
import { messages } from './messages';

export function LanguagePreference(): ReactElement {
  const [preferredLanguage, setPreferredLanguage] = useState(
    localStorage.getItem('preferredLanguage') ?? definition.defaultLanguage ?? 'en-us',
  );

  const onLanguageChange = useCallback((_, language: string) => {
    setPreferredLanguage(language);
    localStorage.setItem('preferredLanguage', language);
  }, []);

  const langMap = useMemo(() => {
    const displayNames = new Intl.DisplayNames([preferredLanguage], { type: 'language' });
    return languages.reduce<{ [key: string]: { localName: string; displayName: string } }>(
      (acc, language) => {
        const localNames = new Intl.DisplayNames([language], { type: 'language' });
        acc[language] = {
          displayName: displayNames.of(language),
          localName: localNames.of(language),
        };

        return acc;
      },
      {},
    );
  }, [preferredLanguage]);

  return (
    <Select
      label={<FormattedMessage {...messages.preferredLanguage} />}
      name="preferredLanguage"
      onChange={onLanguageChange}
      required
      value={preferredLanguage}
    >
      {languages.map((language) => {
        const { displayName, localName } = langMap[language];
        return (
          <option key={language} value={language}>
            {displayName === localName ? displayName : `${displayName} (${localName})`}
          </option>
        );
      })}
    </Select>
  );
}
