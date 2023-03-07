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
import { compareStrings, getLanguageDisplayName, langmap } from '@appsemble/utils';
import axios from 'axios';
import { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { AsyncDataView } from '../../../../components/AsyncDataView/index.js';
import { useApp } from '../index.js';
import { messages } from './messages.js';
import { MessagesLoader } from './MessagesLoader/index.js';

interface LanguageFormValues {
  language?: string;
}

/**
 * The page for translating app messages.
 */
export function TranslationsPage(): ReactElement {
  useMeta(messages.title);

  const { app } = useApp();
  const push = useMessages();
  const { formatMessage } = useIntl();

  const languageIds = useData<string[]>(`/api/apps/${app.id}/messages`);

  const [selectedLanguage, setSelectedLanguage] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const modal = useToggle();

  const languageId =
    selectedLanguage || languageIds.data?.[0] || app.definition.defaultLanguage || 'en';

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
      <div className="is-pulled-right">
        <Button
          className="mr-2"
          color="danger"
          disabled={
            submitting ||
            app.locked ||
            !selectedLanguage ||
            selectedLanguage === (app.definition.defaultLanguage ?? 'en')
          }
          icon="minus"
          onClick={onDeleteLanguage}
        />
        <Button
          color="success"
          disabled={submitting || app.locked}
          icon="plus"
          onClick={modal.enable}
        />
      </div>

      <Title className="my-4" size={4}>
        <FormattedMessage {...messages.messages} />
      </Title>
      <AsyncDataView errorMessage={null} loadingMessage={null} result={languageIds}>
        {() => <MessagesLoader languageId={languageId} />}
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
