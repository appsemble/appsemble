import {
  Button,
  Loader,
  Select,
  SimpleForm,
  SimpleInput,
  SimpleSubmit,
  Title,
  useData,
} from '@appsemble/react-components';
import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useApp } from '../AppContext';
import messages from './messages';

export default function MessageEditor(): ReactElement {
  const { app } = useApp();

  const { data: languages, loading: loadingLanguages } = useData<string[]>(
    `/api/apps/${app.id}/messages`,
  );

  const [selectedLanguage, setSelectedLanguage] = useState<string>(languages?.[0] ?? 'en');

  const { data: appMessages, loading: loadingMessages } = useData<{
    language: string;
    messages: { [messageId: string]: string };
  }>(`/api/apps/${app.id}/messages/${selectedLanguage}`);

  const messageIds = app.definition.pages.map((_, index) => `appsemble:pages.${index}`);

  const languageNames = useMemo(() => {
    const langs = languages || [];
    try {
      const localNames = new Intl.DisplayNames(['en'], { type: 'language' });
      return langs.map((lang) => {
        const nativeNames = new Intl.DisplayNames([lang], { type: 'language' });
        return { id: lang, localName: localNames.of(lang), nativeName: nativeNames.of(lang) };
      });
    } catch (error) {
      return langs.map((lang) => ({ id: lang, localName: lang, nativeName: lang }));
    }
  }, [languages]);

  const onSubmit = useCallback((values: {}) => {}, []);

  const onSelectedLanguageChange = useCallback((_, lang: string) => {
    setSelectedLanguage(lang);
  }, []);

  if (loadingLanguages || loadingMessages) {
    return <Loader />;
  }

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
        {languageNames.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.localName !== lang.nativeName
              ? `${lang.localName} (${lang.nativeName})`
              : lang.localName}
          </option>
        ))}
      </Select>
      <div className="is-grouped is-pulled-right">
        <Button className="mr-2" color="danger" icon="minus" onClick={() => {}} type="button" />
        <Button color="success" icon="plus" onClick={() => {}} type="button" />
      </div>

      <Title className="my-4" level={3}>
        <FormattedMessage {...messages.messages} />
      </Title>
      <SimpleForm defaultValues={{}} onSubmit={onSubmit}>
        {messageIds.map((id) => (
          <SimpleInput key={id} label={id} name={id} type="text" />
        ))}
        <SimpleSubmit>
          <FormattedMessage {...messages.submit} />
        </SimpleSubmit>
      </SimpleForm>
    </div>
  );
}
