import {
  Button,
  CardFooterButton,
  Form,
  Loader,
  Modal,
  Select,
  SimpleForm,
  SimpleInput,
  SimpleSubmit,
  Title,
  useBeforeUnload,
  useConfirmation,
  useData,
  useMessages,
  useToggle,
} from '@appsemble/react-components';
import type { AppMessages } from '@appsemble/types';
import axios from 'axios';
import langmap from 'langmap';
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import getAppMessageIDs from '../../utils/getAppMessageIDs';
import { useApp } from '../AppContext';
import messages from './messages';

// Exclude languages that aren’t accepted by our server and store language codes in lowercase.
const bannedLanguages = ['ck-US', 'en-PI', 'en-UD', 'en@pirate', 'eo-EO', 'fb-LT', 'gx-GR'];
const filteredLangmap = Object.fromEntries(
  Object.entries(langmap)
    .filter(([key]) => !bannedLanguages.includes(key))
    .map(([key, entry]) => [key.toLowerCase(), entry]),
);

export default function MessageEditor(): ReactElement {
  const { app } = useApp();
  const push = useMessages();
  const { formatMessage } = useIntl();

  const { data: languages, loading: loadingLanguages, setData: setLanguages } = useData<string[]>(
    `/api/apps/${app.id}/messages`,
  );
  const {
    disable: disableLoadingMessages,
    enable: enableLoadingMessages,
    enabled: loadingMessages,
  } = useToggle(true);
  const [appMessages, setAppMessages] = useState<AppMessages>();

  const [selectedLanguage, setSelectedLanguage] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const { disable: disableIsAdding, enable: enableIsAdding, enabled: isAdding } = useToggle(false);
  const [addLanguage, setAddLanguage] = useState<string>();
  const {
    disable: disableShouldPrompt,
    enable: enableShouldPrompt,
    enabled: shouldPrompt,
  } = useToggle(false);

  useEffect(() => {
    if (languages?.length) {
      enableLoadingMessages();
      const lang = selectedLanguage ?? languages[0];
      axios
        .get<AppMessages>(`/api/apps/${app.id}/messages/${lang}`)
        .then((d) => {
          setAppMessages(d.data);

          if (!selectedLanguage) {
            setSelectedLanguage(lang);
          }
        })
        .catch(() => setAppMessages(null))
        .finally(() => disableLoadingMessages());
    } else {
      disableLoadingMessages();
    }
  }, [app, disableLoadingMessages, enableLoadingMessages, languages, selectedLanguage]);

  const onSubmit = useCallback(
    async (values: {}) => {
      setSubmitting(true);
      await axios.post(`/api/apps/${app.id}/messages`, {
        language: selectedLanguage,
        messages: values,
      });
      setSubmitting(false);
      push({ color: 'success', body: formatMessage(messages.uploadSuccess) });
      disableShouldPrompt();
    },
    [app.id, disableShouldPrompt, formatMessage, push, selectedLanguage],
  );

  const onSelectedLanguageChange = useCallback((_, lang: string) => {
    setSelectedLanguage(lang);
  }, []);

  const onDeleteLanguage = useConfirmation({
    title: (
      <FormattedMessage
        {...messages.deleteTitle}
        values={{
          language: filteredLangmap[selectedLanguage]?.englishName ?? selectedLanguage,
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
      const newLanguages = languages.filter((lang) => lang !== selectedLanguage);
      setLanguages(newLanguages);
      setSelectedLanguage(newLanguages[0]);
      push({ color: 'info', body: formatMessage(messages.deleteSuccess) });
    },
  });

  const onAddLanguage = useCallback(async () => {
    setLanguages([...languages, addLanguage]);
    setSelectedLanguage(addLanguage);
    // Add the language with empty messages to ensure deleting it works
    // as well as keeping it in the list of supported languages.
    await axios.post(`/api/apps/${app.id}/messages`, { language: addLanguage, messages: {} });
    disableIsAdding();
    enableShouldPrompt();
  }, [addLanguage, app, disableIsAdding, enableShouldPrompt, languages, setLanguages]);

  const onAddLanguageChange = useCallback(
    (_: React.ChangeEvent<HTMLSelectElement>, value: string) => {
      setAddLanguage(value);
    },
    [setAddLanguage],
  );

  const messageIds = useMemo(() => {
    const { pages } = app.definition;
    const blocks = app.definition.pages.flatMap((p) => 'blocks' in p && p.blocks).filter(Boolean);
    const actions = blocks
      .flatMap((b) => 'actions' in b && Object.values(b.actions))
      .filter(Boolean);
    return getAppMessageIDs(pages, blocks, actions);
  }, [app.definition]);

  useBeforeUnload(() => shouldPrompt);

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
        {languages.map((lang) => {
          const l = filteredLangmap[lang];
          return (
            <option key={lang} value={lang}>
              {l.englishName !== l.nativeName
                ? `${l.englishName} (${l.nativeName})`
                : l.englishName}
            </option>
          );
        })}
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

      {languages.length > 0 && (
        <>
          <Title className="my-4" level={3}>
            <FormattedMessage {...messages.messages} />
          </Title>
          <SimpleForm
            defaultValues={Object.fromEntries(
              messageIds.map((id) => [id, appMessages?.messages[id]]),
            )}
            onSubmit={onSubmit}
          >
            {messageIds.map((id) => (
              <SimpleInput key={id} label={id} name={id} type="text" />
            ))}
            <SimpleSubmit disabled={submitting}>
              <FormattedMessage {...messages.submit} />
            </SimpleSubmit>
          </SimpleForm>
        </>
      )}
      <Modal
        component={Form}
        footer={
          <>
            <CardFooterButton onClick={disableIsAdding}>
              <FormattedMessage {...messages.cancel} />
            </CardFooterButton>
            <CardFooterButton color="primary" disabled={!addLanguage} type="submit">
              <FormattedMessage {...messages.add} />
            </CardFooterButton>
          </>
        }
        isActive={isAdding}
        onClose={disableIsAdding}
        onSubmit={onAddLanguage}
        title={<FormattedMessage {...messages.addLanguageTitle} />}
      >
        <Select
          label={<FormattedMessage {...messages.language} />}
          name="language"
          onChange={onAddLanguageChange}
          required
        >
          <option hidden> </option>
          {Object.entries(filteredLangmap).map(([lang, names]) => {
            const languageString =
              names.englishName !== names.nativeName
                ? `${names.englishName} (${names.nativeName})`
                : names.englishName;
            return (
              <option key={lang} value={lang}>
                {`${languageString} [${lang}]`}
              </option>
            );
          })}
        </Select>
      </Modal>
    </>
  );
}
