import {
  Button,
  CardFooterButton,
  FormButtons,
  Loader,
  Modal,
  Select,
  SimpleBeforeUnload,
  SimpleForm,
  SimpleFormError,
  SimpleInput,
  SimpleSubmit,
  TextArea,
  Title,
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
import styles from './index.css';
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
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [appMessages, setAppMessages] = useState<AppMessages>();

  const [selectedLanguage, setSelectedLanguage] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const modal = useToggle();

  const languageId = selectedLanguage || languages?.[0];

  useEffect(() => {
    if (languageId) {
      setLoadingMessages(true);
      axios
        .get<AppMessages>(`/api/apps/${app.id}/messages/${languageId}`)
        .then((d) => {
          setAppMessages(d.data);
        })
        .catch(() => setAppMessages(null))
        .finally(() => setLoadingMessages(false));
    } else {
      setLoadingMessages(false);
    }
  }, [app, languageId]);

  const onSubmit = useCallback(
    async (values: AppMessages['messages']) => {
      setSubmitting(true);
      await axios.post(`/api/apps/${app.id}/messages`, {
        language: languageId,
        messages: values,
      });
      setSubmitting(false);
      push({ color: 'success', body: formatMessage(messages.uploadSuccess) });
    },
    [app, formatMessage, push, languageId],
  );

  const onSelectedLanguageChange = useCallback((_, lang: string) => {
    setSelectedLanguage(lang);
  }, []);

  const onDeleteLanguage = useConfirmation({
    title: (
      <FormattedMessage
        {...messages.deleteTitle}
        values={{
          language: filteredLangmap[languageId]?.englishName ?? languageId,
        }}
      />
    ),
    body: <FormattedMessage {...messages.deleteBody} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    action: async () => {
      setSubmitting(true);
      await axios.delete(`/api/apps/${app.id}/messages/${languageId}`);
      setSubmitting(false);
      const newLanguages = languages.filter((lang) => lang !== languageId);
      setSelectedLanguage(newLanguages[0]);
      setLanguages(newLanguages);
      push({ color: 'info', body: formatMessage(messages.deleteSuccess) });
    },
  });

  const onAddLanguage = useCallback(
    async ({ language: lang }) => {
      // Add the language with empty messages to ensure deleting it works
      // as well as keeping it in the list of supported languages.
      await axios.post(`/api/apps/${app.id}/messages`, { language: lang, messages: {} });

      setLanguages([...languages, lang]);
      setSelectedLanguage(lang);
      modal.disable();
    },
    [app, languages, modal, setLanguages],
  );

  const messageIds = useMemo(() => {
    const { pages } = app.definition;
    // XXX: Replace with iter function to properly handle nested blocks
    const blocks = app.definition.pages.flatMap((p) => 'blocks' in p && p.blocks).filter(Boolean);
    const actions = blocks
      .flatMap((b) => 'actions' in b && Object.values(b.actions))
      .filter(Boolean);
    return getAppMessageIDs(pages, blocks, actions);
  }, [app.definition]);

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
        value={languageId}
      >
        {languages.map((lang) => {
          const language = filteredLangmap[lang];
          return (
            <option key={lang} value={lang}>
              {language.englishName !== language.nativeName
                ? `${language.englishName} (${language.nativeName})`
                : language.englishName}
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
        />
        <Button color="success" disabled={submitting} icon="plus" onClick={modal.enable} />
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
            <SimpleFormError>
              {() => <FormattedMessage {...messages.uploadError} />}
            </SimpleFormError>
            <SimpleBeforeUnload />
            {messageIds.map((id) => (
              <SimpleInput<typeof TextArea>
                key={id}
                component={TextArea}
                label={id}
                name={id}
                rows={2}
              />
            ))}
            <FormButtons>
              <SimpleSubmit disabled={submitting}>
                <FormattedMessage {...messages.submit} />
              </SimpleSubmit>
            </FormButtons>
          </SimpleForm>
        </>
      )}
      <Modal
        component={SimpleForm}
        defaultValues={{ language: undefined }}
        footer={
          <>
            <CardFooterButton onClick={modal.disable}>
              <FormattedMessage {...messages.cancel} />
            </CardFooterButton>
            <SimpleSubmit className={`card-footer-item ${styles.footerSubmit}`} color="primary">
              <FormattedMessage {...messages.add} />
            </SimpleSubmit>
          </>
        }
        isActive={modal.enabled}
        onClose={modal.disable}
        onSubmit={onAddLanguage}
        title={<FormattedMessage {...messages.addLanguageTitle} />}
      >
        <SimpleFormError>{() => <FormattedMessage {...messages.addError} />}</SimpleFormError>
        <SimpleInput
          component={Select}
          label={<FormattedMessage {...messages.language} />}
          name="language"
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
        </SimpleInput>
      </Modal>
    </>
  );
}
