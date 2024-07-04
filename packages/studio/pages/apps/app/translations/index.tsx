import {
  Button,
  FileUpload,
  Icon,
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
import { type AppMessages, type AppsembleMessages } from '@appsemble/types';
import { compareStrings, getLanguageDisplayName, langmap } from '@appsemble/utils';
import { downloadBlob } from '@appsemble/web-utils';
import axios from 'axios';
import { type ChangeEvent, type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { MessagesForm } from './MessagesForm/index.js';
import { AsyncDataView } from '../../../../components/AsyncDataView/index.js';
import { supportedLanguages } from '../../../../utils/constants.js';
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
  const [parsedLanguage, setParsedLanguage] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [parsedMessages, setParsedMessages] = useState<AppMessages | AppMessages[]>();
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

  const [uploadingImportFile, setUploadingImportFile] = useState<File>(null);

  const onImportFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files[0];
    setUploadingImportFile(selectedFile);
    const languageName = selectedFile.name.split('.')[0];
    if (Object.keys(supportedLanguages).includes(languageName)) {
      setParsedLanguage(languageName);
    } else {
      setParsedLanguage(null);
    }
    const readMessages = await selectedFile.text();
    setParsedMessages(JSON.parse(readMessages));
  }, []);

  const navigate = useNavigate();
  const { hash } = useLocation();

  const openModal = useCallback(() => {
    navigate({ hash: 'import' }, { replace: true });
  }, [navigate]);

  const closeModal = useCallback(() => {
    navigate({ hash: null }, { replace: true });
    setUploadingImportFile(null);
    setParsedLanguage(null);
    setParsedMessages(null);
  }, [navigate]);

  const active = hash === '#import';

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
  const createMessagesToBeExported = useCallback(
    (appMessages: AppsembleMessages, defaultAppMessages: AppsembleMessages) => {
      const blocks = { ...appMessages.blocks };
      for (const blockId of Object.keys(blocks)) {
        for (const version of Object.keys(blocks[blockId])) {
          for (const messageId of Object.keys(blocks[blockId][version])) {
            if (
              defaultAppMessages.blocks[blockId][version]?.[messageId] !==
              appMessages.blocks[blockId][version][messageId]
            ) {
              blocks[blockId][version][messageId] = appMessages.blocks[blockId][version][messageId];
            }
          }
        }
      }

      const messagesToBeExported = {
        app: Object.fromEntries(
          Object.entries(appMessages.app).filter(
            ([key, value]) => defaultAppMessages.app[key] !== value,
          ),
        ),
        core: Object.fromEntries(
          Object.entries(appMessages.core).filter(
            ([key, value]) => defaultAppMessages.core[key] !== value,
          ),
        ),
        blocks,
        messageIds: appMessages.messageIds,
      };
      return messagesToBeExported;
    },
    [],
  );

  const downloadJson = useCallback(() => {
    const appMessages = result?.data?.messages;
    const defaultAppMessages = defaultMessagesResult?.data?.messages;
    const messagesToBeExported = createMessagesToBeExported(appMessages, defaultAppMessages);
    const bytes = new TextEncoder().encode(JSON.stringify(messagesToBeExported, null, 2));
    downloadBlob(new Blob([bytes]), `${languageId}.json`);
  }, [createMessagesToBeExported, defaultMessagesResult, languageId, result?.data?.messages]);

  const exportAllMessages = useCallback(async () => {
    const { data: allMessages } = await axios.get<AppMessages[]>(
      `/api/apps/${app.id}/messages?includeMessages=true`,
    );
    const { data: defaultAllMessages } = await axios.get<AppMessages[]>(
      `/api/apps/${app.id}/messages?includeMessages=true&override=false`,
    );
    const messagesToBeExported = allMessages.map((item, index: number) => {
      const foundMessages = createMessagesToBeExported(
        item.messages,
        defaultAllMessages[index].messages,
      );
      return {
        language: item.language,
        messages: foundMessages,
      };
    });
    const bytes = new TextEncoder().encode(JSON.stringify(messagesToBeExported, null, 2));
    downloadBlob(new Blob([bytes]), 'i18n.json');
  }, [app.id, createMessagesToBeExported]);

  const importTranslations = useCallback(() => {
    if (uploadingImportFile instanceof Blob) {
      axios
        .post<AppMessages>(
          `/api/apps/${app.id}/messages`,
          Array.isArray(parsedMessages)
            ? parsedMessages
            : {
                language: parsedLanguage || languageId,
                messages: parsedMessages,
              },
        )
        .then(({ data }) => {
          if (Array.isArray(data)) {
            const selectedLanguageData = data.find((item) => item.language === languageId);
            result.setData(selectedLanguageData);
            const languagesFromFiles = data
              .map((item) => item.language)
              .map(getLanguageDisplayName);
            const foundLanguages = languagesFromFiles.join(', ');
            push({
              body: formatMessage(messages.importSuccess, {
                selectedLanguage: foundLanguages,
              }),
              color: 'success',
            });
            closeModal();
          } else {
            result.setData(data);
            push({
              body: formatMessage(messages.importSuccess, {
                selectedLanguage: getLanguageDisplayName(parsedLanguage || languageId),
              }),
              color: 'success',
            });
            closeModal();
          }
        })
        .catch(() => {
          push({
            body: formatMessage(messages.uploadError),
            color: 'danger',
          });
        });
    }
  }, [
    app.id,
    closeModal,
    formatMessage,
    languageId,
    parsedLanguage,
    parsedMessages,
    push,
    result,
    uploadingImportFile,
  ]);

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
          <Button icon="file-export" onClick={exportAllMessages}>
            <FormattedMessage {...messages.exportAll} />
          </Button>

          <Button icon="download" onClick={downloadJson}>
            <FormattedMessage {...messages.export} />
          </Button>
          <Button icon="upload" onClick={openModal}>
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
      <ModalCard
        component={SimpleForm}
        defaultValues={{ messages: null }}
        footer={
          <SimpleModalFooter
            cancelLabel={<FormattedMessage {...messages.cancel} />}
            onClose={closeModal}
            submitLabel={<FormattedMessage {...messages.add} />}
          />
        }
        isActive={active}
        onClose={closeModal}
        onSubmit={importTranslations}
      >
        <p className="has-text-danger">
          {parsedLanguage ? (
            <>
              <Icon icon="warning" />
              <FormattedMessage
                {...messages.overrideWarningLanguage}
                values={{ language: getLanguageDisplayName(parsedLanguage) }}
              />
            </>
          ) : Array.isArray(parsedMessages) ? (
            <>
              <Icon icon="warning" />
              <FormattedMessage {...messages.overrideWarningAll} />
            </>
          ) : uploadingImportFile ? (
            <>
              <Icon icon="warning" />
              <FormattedMessage
                {...messages.overrideWarningLanguage}
                values={{ language: getLanguageDisplayName(languageId) }}
              />
            </>
          ) : null}
        </p>
        <SimpleFormError>
          {({ error }) =>
            axios.isAxiosError(error) ? (
              <FormattedMessage {...messages.errorMessage} />
            ) : (
              <FormattedMessage {...messages.importError} />
            )
          }
        </SimpleFormError>
        <SimpleFormField
          accept="application/json"
          component={FileUpload}
          fileButtonLabel={<FormattedMessage {...messages.import} />}
          fileLabel={uploadingImportFile?.name ?? 'No File'}
          label={<FormattedMessage {...messages.import} />}
          name="messages"
          onChange={onImportFileChange}
          required
        />
      </ModalCard>
    </>
  );
}
