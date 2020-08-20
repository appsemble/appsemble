import { Select } from '@appsemble/react-components';
import { getLanguageDisplayName } from '@appsemble/utils';
import React, { ReactElement, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useHistory, useRouteMatch } from 'react-router-dom';

import { definition, languages } from '../../../utils/settings';
import { messages } from './messages';

export function LanguagePreference(): ReactElement {
  const history = useHistory();
  const route = useRouteMatch();

  const [preferredLanguage, setPreferredLanguage] = useState(
    localStorage.getItem('preferredLanguage') ?? definition.defaultLanguage ?? 'en-us',
  );

  const onLanguageChange = useCallback(
    (_, language: string) => {
      history.replace(route.url.replace(preferredLanguage, language));
      setPreferredLanguage(language);
      localStorage.setItem('preferredLanguage', language);
    },
    [history, preferredLanguage, route.url],
  );

  return (
    <Select
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
    </Select>
  );
}
