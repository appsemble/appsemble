import { SelectField } from '@appsemble/react-components';
import { getLanguageDisplayName } from '@appsemble/utils';
import { ReactElement, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useHistory, useParams, useRouteMatch } from 'react-router-dom';

import { languages } from '../../../utils/settings';
import { messages } from './messages';

export function LanguagePreference(): ReactElement {
  const history = useHistory();
  const { url } = useRouteMatch();
  const { lang } = useParams<{ lang: string }>();

  const [preferredLanguage, setPreferredLanguage] = useState(
    localStorage.getItem('preferredLanguage') ?? lang,
  );

  const onLanguageChange = useCallback(
    (event, language: string) => {
      history.replace(url.replace(preferredLanguage, language));
      setPreferredLanguage(language);
      localStorage.setItem('preferredLanguage', language);
    },
    [history, preferredLanguage, url],
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
