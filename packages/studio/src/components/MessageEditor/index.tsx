import { Button, Loader, Select, SimpleForm, Title, useData } from '@appsemble/react-components';
import React, { ReactElement, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useApp } from '../AppContext';
import messages from './messages';

export default function MessageEditor(): ReactElement {
  const { app } = useApp();

  const { data: languages, loading: loadingLanguages } = useData<string[]>(
    `/api/apps/${app.id}/messages`,
  );

  const [selectedLanguage, setSelectedLanguage] = useState<string>();

  const onSubmit = useCallback((values: {}) => {}, []);

  const onSelectedLanguageChange = useCallback((_, lang: string) => {
    setSelectedLanguage(lang);
  }, []);

  if (loadingLanguages) {
    return <Loader />;
  }

  const localNames = new Intl.DisplayNames(['en'], { type: 'language' });

  return (
    <div>
      <Title level={2}>
        <FormattedMessage {...messages.title} />
      </Title>
      <Select
        label={<FormattedMessage {...messages.selectedLanguage} />}
        name="selectedLanguage"
        onChange={onSelectedLanguageChange}
      >
        {languages.map((lang) => {
          const nativeName = new Intl.DisplayNames([lang], { type: 'language' }).of(lang);
          const localName = localNames.of(lang);
          return (
            <option key={lang} value={lang}>
              {localName !== nativeName ? `${localName} (${nativeName})` : localName}
            </option>
          );
        })}
      </Select>
      <SimpleForm defaultValues={{}} onSubmit={onSubmit}>
        <Button color="primary" type="submit">
          <FormattedMessage {...messages.submit} />
        </Button>
      </SimpleForm>
    </div>
  );
}
