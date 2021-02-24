import {
  Button,
  FormButtons,
  Loader,
  Modal,
  SelectField,
  SimpleBeforeUnload,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleModalFooter,
  SimpleSubmit,
  TextAreaField,
  Title,
  useConfirmation,
  useData,
  useMessages,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import { AppMessages } from '@appsemble/types';
import { getLanguageDisplayName, iterApp, langmap } from '@appsemble/utils';
import axios from 'axios';
import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useApp } from '..';
import { findMessageIds } from '../../../../utils/findMessageIds';
import { messages } from './messages';

export function TranslationsPage(): ReactElement {
  useMeta(messages.title);

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
    async (values: AppMessages['messages']['app']) => {
      if (app.locked) {
        return;
      }

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
          language: langmap[languageId]?.englishName ?? languageId,
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
    const actions: string[] = [];
    const pages: string[] = [];
    iterApp(app.definition, {
      onBlock(block) {
        findMessageIds(block.header, (messageId) => actions.push(messageId));
        findMessageIds(block.parameters, (messageId) => actions.push(messageId));
      },
      onAction(action) {
        findMessageIds(action.remap, (messageId) => actions.push(messageId));
      },
      onPage(_page, prefix) {
        pages.push(prefix.join('.'));

        if (_page.type === 'tabs') {
          _page.subPages.forEach((_, index) => {
            pages.push(`${prefix.join('.')}.subPages.${index}`);
          });
        }
      },
    });

    const blockMessages = appMessages
      ? Object.entries(appMessages.messages.blocks).flatMap(([name, versions]) =>
          Object.entries(versions).flatMap(([version, versionMessages]) =>
            Object.keys(versionMessages).map(
              (versionMessage) => `${name}/${version}/${versionMessage}`,
            ),
          ),
        )
      : [];

    return [
      ...[...new Set(pages)].sort(),
      ...[...new Set(actions)].sort(),
      ...blockMessages.sort(),
    ];
  }, [app.definition, appMessages]);

  if (loadingLanguages || loadingMessages) {
    return <Loader />;
  }

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
        {languages.map((lang) => (
          <option key={lang} value={lang}>
            {getLanguageDisplayName(lang)}
          </option>
        ))}
      </SelectField>
      <div className="is-pulled-right">
        <Button
          className="mr-2"
          color="danger"
          disabled={submitting || app.locked}
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

      {languages.length > 0 && (
        <>
          <Title className="my-4" size={4}>
            <FormattedMessage {...messages.messages} />
          </Title>
          <SimpleForm
            defaultValues={Object.fromEntries(
              messageIds.map((id) => [id, appMessages?.messages.app[id]]),
            )}
            onSubmit={onSubmit}
          >
            <SimpleFormError>
              {() => <FormattedMessage {...messages.uploadError} />}
            </SimpleFormError>
            <SimpleBeforeUnload />
            {messageIds.map((id) => (
              <SimpleFormField
                component={TextAreaField}
                disabled={submitting || app.locked}
                key={id}
                label={id}
                name={id}
                rows={2}
              />
            ))}
            <FormButtons>
              <SimpleSubmit disabled={submitting || app.locked}>
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
      </Modal>
    </>
  );
}
