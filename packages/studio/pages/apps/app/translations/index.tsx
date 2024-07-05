import {
  Button,
  ModalCard,
  SelectField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleModalFooter,
  Title,
  useConfirmation,
  useData,
  useMessages,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import { type AppMessages } from '@appsemble/types';
import { compareStrings, getLanguageDisplayName, langmap } from '@appsemble/utils';
import { downloadBlob } from '@appsemble/web-utils';
import axios from 'axios';
import { type ChangeEvent, type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { MessagesForm } from './MessagesForm/index.js';
import { AsyncDataView } from '../../../../components/AsyncDataView/index.js';
import { useApp } from '../index.js';

interface LanguageFormValues {
  language?: string;
}

/**
 * The page for translating app messages.
 */
export function TranslationsPage(): ReactNode {
  useMeta(messages.title);

  let { lang: pageLanguage } = useParams<{ lang: string }>();

  const { app } = useApp();
  const push = useMessages();
  const { formatMessage } = useIntl();

  const languageIds = useData<string[]>(`/api/apps/${app.id}/messages`);
  const [selectedLanguage, setSelectedLanguage] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const modal = useToggle();

  if (!languageIds?.data?.includes(pageLanguage)) {
    pageLanguage = 'en';
  }

  const languageId =
    selectedLanguage ||
    pageLanguage ||
    app.definition.defaultLanguage ||
    languageIds.data?.[0] ||
    'en';

  const onSelectedLanguageChange = useCallback((event: ChangeEvent, lang: string) => {
    setSelectedLanguage(lang);
  }, []);

  const onDeleteLanguage = useConfirmation({
    title: (
      <FormattedMessage
        {...messages.deleteTitle}
        values={{
          language: langmap[languageId]?.englishName ?? languageId,
        }}
      />
    ),
    body: <FormattedMessage {...messages.deleteBody} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    async action() {
      setSubmitting(true);
      try {
        await axios.delete(`/api/apps/${app.id}/messages/${languageId}`);
        const newLanguages = languageIds.data.filter((lang) => lang !== languageId);
        setSelectedLanguage(newLanguages[0]);
        languageIds.setData(newLanguages);
        push({ color: 'info', body: formatMessage(messages.deleteSuccess) });
      } catch {
        push({ body: formatMessage(messages.deleteError), color: 'danger' });
      }
      setSubmitting(false);
    },
  });

  const onAddLanguage = useCallback(
    async ({ language: lang }: LanguageFormValues) => {
      // Add the language with empty messages to ensure deleting it works
      // as well as keeping it in the list of supported languages.
      await axios.post(`/api/apps/${app.id}/messages`, { language: lang, messages: {} });

      languageIds.setData((oldLanguages) => [...oldLanguages, lang].sort(compareStrings));
      setSelectedLanguage(lang);
      modal.disable();
    },
    [app, modal, languageIds],
  );

  const result = useData<AppMessages>(`/api/apps/${app.id}/messages/${languageId}`);
  const defaultMessagesResult = useData<AppMessages>(
    `/api/apps/${app.id}/messages/${languageId}?override=false`,
  );

  const downloadJson = useCallback(() => {
    const bytes = new TextEncoder().encode(JSON.stringify(result?.data?.messages, null, 2));
    downloadBlob(new Blob([bytes]), `${languageId}.json`);
  }, [languageId, result?.data?.messages]);

  const uploadJson = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.click();
    input.addEventListener('change', () => {
      const [file] = input.files;
      const reader = new FileReader();
      reader.addEventListener(
        'load',
        () => {
          try {
            axios
              .post<AppMessages>(`/api/apps/${app.id}/messages`, {
                language: languageId,
                messages: JSON.parse(reader.result as string),
              })
              .then(({ data }) => {
                result.setData(data);
                push({
                  body: formatMessage(messages.importSuccess, {
                    selectedLanguage: getLanguageDisplayName(languageId),
                  }),
                  color: 'success',
                });
              })
              .catch(() => {
                push({
                  body: formatMessage(messages.uploadError),
                  color: 'danger',
                });
              });
          } catch {
            push({
              body: formatMessage(messages.importError),
              color: 'danger',
            });
          }
        },
        false,
      );

      if (file) {
        file.text();
      }
    });
  }, [app.id, formatMessage, languageId, push, result]);

  return (
    <>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <SelectField
        disabled={submitting}
        label={<FormattedMessage {...messages.selectedLanguage} />}
        name="selectedLanguage"
        onChange={onSelectedLanguageChange}
        value={languageId}
      >
        {languageIds.data?.map((lang) => (
          <option key={lang} value={lang}>
            {getLanguageDisplayName(lang)}
          </option>
        ))}
      </SelectField>
      <div className="buttons is-justify-content-space-between">
        <span className="buttons m-0">
          <Button
            color="danger"
            disabled={
              submitting ||
              app.locked !== 'unlocked' ||
              !selectedLanguage ||
              selectedLanguage === (app.definition.defaultLanguage ?? 'en')
            }
            icon="minus"
            onClick={onDeleteLanguage}
          />
          <Button
            color="success"
            disabled={submitting || app.locked !== 'unlocked'}
            icon="plus"
            onClick={modal.enable}
          />
        </span>
        <span className="buttons m-0">
          <Button icon="download" onClick={downloadJson}>
            <FormattedMessage {...messages.export} />
          </Button>
          <Button icon="upload" onClick={uploadJson}>
            <FormattedMessage {...messages.import} />
          </Button>
        </span>
      </div>

      <Title className="my-4" size={4}>
        <FormattedMessage {...messages.messages} />
      </Title>

      <AsyncDataView
        errorMessage={<FormattedMessage {...messages.errorMessage} />}
        loadingMessage={<FormattedMessage {...messages.loadingMessage} />}
        result={result}
      >
        {(appMessages) => (
          <AsyncDataView
            errorMessage={<FormattedMessage {...messages.errorMessage} />}
            loadingMessage={<FormattedMessage {...messages.loadingMessage} />}
            result={defaultMessagesResult}
          >
            {(defaultAppMessages) => (
              <MessagesForm
                appMessages={appMessages}
                defaultAppMessages={defaultAppMessages}
                languageId={languageId}
              />
            )}
          </AsyncDataView>
        )}
      </AsyncDataView>
      <ModalCard
        component={SimpleForm}
        defaultValues={{ language: undefined }}
        footer={
          <SimpleModalFooter
            cancelLabel={<FormattedMessage {...messages.cancel} />}
            onClose={modal.disable}
            submitLabel={<FormattedMessage {...messages.add} />}
          />
        }
        isActive={modal.enabled}
        onClose={modal.disable}
        onSubmit={onAddLanguage}
        title={<FormattedMessage {...messages.addLanguageTitle} />}
      >
        <SimpleFormError>{() => <FormattedMessage {...messages.addError} />}</SimpleFormError>
        <SimpleFormField
          component={SelectField}
          label={<FormattedMessage {...messages.language} />}
          name="language"
          required
        >
          <option hidden> </option>
          {Object.entries(langmap).map(([lang, { englishName, nativeName }]) => (
            <option key={lang} value={lang}>
              {`${englishName}${englishName === nativeName ? '' : ` (${nativeName})`} [${lang}]`}
            </option>
          ))}
        </SimpleFormField>
      </ModalCard>
    </>
  );
}
