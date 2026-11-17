import { Option, SelectField } from '@appsemble/preact-components';
import { getLanguageDisplayName } from '@appsemble/utils';
import { type ReactNode, useCallback, useState } from 'react';
import { useLocation, useParams } from 'wouter-preact';

import { messages } from './messages.js';
import { FormattedMessage, useIntl } from '../../IntlProvider/index.js';
import { languages, supportedLanguages } from '../../../utils/settings.js';

export function LanguagePreference(): ReactNode {
  const [, navigate] = useLocation();
  const { lang } = useParams<{ lang: string }>();
  const url = `/${lang}/Settings`;

  const [preferredLanguage, setPreferredLanguage] = useState(
    localStorage.getItem('preferredLanguage') ?? lang,
  );
  const { formatMessage } = useIntl();

  const onLanguageChange = useCallback(
    (event: unknown, language: string) => {
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
        <Option key={language} value={language}>
          {supportedLanguages.includes(language)
            ? `${getLanguageDisplayName(language)} (${formatMessage(messages.supported)})`
            : getLanguageDisplayName(language)}
        </Option>
      ))}
    </SelectField>
  );
}
