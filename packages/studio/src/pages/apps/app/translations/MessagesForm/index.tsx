import {
  FormButtons,
  SimpleBeforeUnload,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  TextAreaField,
  useMessages,
} from '@appsemble/react-components';
import { AppMessages } from '@appsemble/types';
import { extractAppMessages, normalizeBlockName } from '@appsemble/utils';
import axios from 'axios';
import { ReactElement, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useApp } from '../..';
import { messages } from './messages';

interface MessagesFormProps {
  /**
   * The language ID to eit messages for.
   */
  languageId: string;

  /**
   * The old app messages.
   */
  appMessages: AppMessages;
}

/**
 * Render a form for editing app messages.
 */
export function MessagesForm({ appMessages, languageId }: MessagesFormProps): ReactElement {
  const { app } = useApp();
  const push = useMessages();
  const { formatMessage } = useIntl();

  const messageDefaults = useMemo(() => {
    const allMessages: Record<string, string> = {
      // XXX Extract all core app messages
      'app.src.components.OpenIDLogin.loginWith': '',
    };
    const blockMessages: Record<string, Record<string, string>> = {};

    for (const [name, versions] of Object.entries(appMessages.messages.blocks)) {
      for (const [version, versionMessages] of Object.entries(versions)) {
        const msgs: Record<string, string> = {};
        blockMessages[`${name}/${version}`] = msgs;
        for (const [messageId, messageString] of Object.entries(versionMessages)) {
          allMessages[`${name}/${version}/${messageId}`] = messageString;
          msgs[messageId] = messageString;
        }
      }
    }

    return Object.entries(
      Object.assign(
        allMessages,
        extractAppMessages(app.definition, (block, prefix) => {
          const blockName = `${normalizeBlockName(block.type)}/${block.version}`;
          const msgs = blockMessages[blockName];
          if (msgs) {
            for (const [name, msg] of Object.entries(msgs)) {
              allMessages[`${prefix.join('.')}.${name}`] = msg;
            }
          }
        }),
      ),
    ).sort(([a], [b]) => a.localeCompare(b));
  }, [app, appMessages]);

  const onSubmit = useCallback(
    async (values: Record<string, string>) => {
      await axios.post(`/api/apps/${app.id}/messages`, {
        language: languageId,
        messages: values,
      });
      push({ color: 'success', body: formatMessage(messages.uploadSuccess) });
    },
    [app, formatMessage, push, languageId],
  );

  const defaultValues = useMemo(
    () => Object.fromEntries(messageDefaults.map(([id]) => [id, appMessages?.messages.app[id]])),
    [appMessages?.messages.app, messageDefaults],
  );

  return (
    <SimpleForm defaultValues={defaultValues} onSubmit={onSubmit}>
      <SimpleFormError>{() => <FormattedMessage {...messages.uploadError} />}</SimpleFormError>
      <SimpleBeforeUnload />
      {messageDefaults.map(([id, defaultMessage]) => (
        <SimpleFormField
          component={TextAreaField}
          disabled={app.locked}
          key={id}
          label={id}
          name={id}
          placeholder={defaultMessage}
          rows={2}
        />
      ))}
      <FormButtons>
        <SimpleSubmit className="mb-4" disabled={app.locked}>
          <FormattedMessage {...messages.submit} />
        </SimpleSubmit>
      </FormButtons>
    </SimpleForm>
  );
}
