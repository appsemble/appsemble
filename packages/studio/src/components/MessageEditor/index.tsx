import {
  Button,
  Form,
  Loader,
  Modal,
  Select,
  SimpleForm,
  SimpleInput,
  SimpleSubmit,
  Title,
  useConfirmation,
  useData,
  useToggle,
} from '@appsemble/react-components';
import axios from 'axios';
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
  const [submitting, setSubmitting] = useState(false);
  const { disable: disableIsAdding, enable: enableIsAdding, enabled: isAdding } = useToggle(false);
  const [addLanguage, setAddLanguage] = useState<string>();

  const { data: appMessages, loading: loadingMessages } = useData<{
    language: string;
    messages: { [messageId: string]: string };
  }>(`/api/apps/${app.id}/messages/${selectedLanguage}`);

  const messageIds = [
    ...new Set([
      ...Object.keys(appMessages?.messages ?? {}),
      ...app.definition.pages.map((_, index) => `appsemble:pages.${index}`),
    ]),
  ];

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

  const onSubmit = useCallback(
    async (values: {}) => {
      setSubmitting(true);
      await axios.post(`/api/apps/${app.id}/messages`, {
        language: selectedLanguage,
        messages: values,
      });
      setSubmitting(false);
    },
    [app, selectedLanguage],
  );

  const onSelectedLanguageChange = useCallback((_, lang: string) => {
    setSelectedLanguage(lang);
  }, []);

  const onDeleteLanguage = useConfirmation({
    title: (
      <FormattedMessage
        {...messages.deleteTitle}
        values={{
          language:
            languageNames.find((l) => l.id === selectedLanguage)?.localName ?? selectedLanguage,
        }}
      />
    ),
    body: <FormattedMessage {...messages.deleteBody} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    action: async () => {
      setSubmitting(true);
      await axios.delete(`/api/apps/${app.id}/messages/${selectedLanguage}`);
      setSubmitting(false);
      setSelectedLanguage(languages[0]);
    },
  });

  const onAddLanguage = useCallback(async () => {}, []);

  const onAddLanguageChange = useCallback(
    (_: React.ChangeEvent<HTMLSelectElement>, value: string) => {
      setAddLanguage(value);
    },
    [setAddLanguage],
  );

  if (loadingLanguages || loadingMessages) {
    return <Loader />;
  }

  return (
    <>
      <Title level={2}>
        <FormattedMessage {...messages.title} />
      </Title>
      <Select
        disabled={submitting}
        label={<FormattedMessage {...messages.selectedLanguage} />}
        name="selectedLanguage"
        onChange={onSelectedLanguageChange}
        value={selectedLanguage}
      >
        {languageNames.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.localName !== lang.nativeName
              ? `${lang.localName} (${lang.nativeName})`
              : lang.localName}
          </option>
        ))}
      </Select>
      <div className="is-pulled-right">
        <Button
          className="mr-2"
          color="danger"
          disabled={submitting}
          icon="minus"
          onClick={onDeleteLanguage}
          type="button"
        />
        <Button
          color="success"
          disabled={submitting}
          icon="plus"
          onClick={enableIsAdding}
          type="button"
        />
      </div>

      <Title className="my-4" level={3}>
        <FormattedMessage {...messages.messages} />
      </Title>
      <SimpleForm
        defaultValues={Object.fromEntries(messageIds.map((id) => [id, appMessages.messages[id]]))}
        onSubmit={onSubmit}
      >
        {messageIds.map((id) => (
          <SimpleInput key={id} label={id} name={id} type="text" />
        ))}
        <SimpleSubmit disabled={submitting}>
          <FormattedMessage {...messages.submit} />
        </SimpleSubmit>
      </SimpleForm>
      <Modal
        isActive={isAdding}
        onClose={disableIsAdding}
        title={<FormattedMessage {...messages.addLanguageTitle} />}
      >
        <Form onSubmit={onAddLanguage}>
          <Select label={messages.language} name="language" onChange={onAddLanguageChange}>
            <option value="de">DE</option>
          </Select>
        </Form>
      </Modal>
    </>
  );
}
