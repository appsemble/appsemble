import { SelectField } from '@appsemble/react-components';
import { getLanguageDisplayName } from '@appsemble/utils';
import { type ChangeEvent, type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { languages } from '../../../utils/settings.js';

export function LanguagePreference(): ReactNode {
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const url = `/${lang}/Settings`;

  const [preferredLanguage, setPreferredLanguage] = useState(
    localStorage.getItem('preferredLanguage') ?? lang,
  );

  const onLanguageChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>, language: string) => {
      // @ts-expect-error 2769 No overload matches this call (strictNullChecks)
      navigate(url.replace(preferredLanguage, language), { replace: true });
      setPreferredLanguage(language);
      localStorage.setItem('preferredLanguage', language);
    },
    [navigate, preferredLanguage, url],
  );

  return (
    <SelectField
      label={<FormattedMessage {...messages.preferredLanguage} />}
      name="preferredLanguage"
      onChange={onLanguageChange}
      required
      value={preferredLanguage}
    >
      {languages.map((language) => (
        <option key={language} value={language}>
          {getLanguageDisplayName(language)}
        </option>
      ))}
    </SelectField>
  );
}
