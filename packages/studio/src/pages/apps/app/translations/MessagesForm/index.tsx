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
import { compareStrings, extractAppMessages, normalizeBlockName } from '@appsemble/utils';
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

  const messageIds = useMemo(() => {
    const blockMessages = appMessages
      ? Object.entries(appMessages.messages.blocks).flatMap(([name, versions]) =>
          Object.entries(versions).flatMap(([version, versionMessages]) =>
            Object.keys(versionMessages).map(
              (versionMessage) => `${name}/${version}/${versionMessage}`,
            ),
          ),
        )
      : [];

    const ids = extractAppMessages(app.definition, (block, prefix) => {
      const blockName = `${normalizeBlockName(block.type)}/${block.version}`;
      const pageBlockMessages = blockMessages.filter((name) => name.startsWith(blockName));
      return pageBlockMessages.map((name) => `${prefix.join('.')}.${name.split('/').pop()}`);
    });

    return [
      ...new Set([
        ...ids,
        ...blockMessages,
        // XXX Extract all core app messages
        'app.src.components.OpenIDLogin.loginWith',
      ]),
    ].sort(compareStrings);
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
    () => Object.fromEntries(messageIds.map((id) => [id, appMessages?.messages.app[id]])),
    [appMessages?.messages.app, messageIds],
  );

  return (
    <SimpleForm defaultValues={defaultValues} onSubmit={onSubmit}>
      <SimpleFormError>{() => <FormattedMessage {...messages.uploadError} />}</SimpleFormError>
      <SimpleBeforeUnload />
      {messageIds.map((id) => (
        <SimpleFormField
          component={TextAreaField}
          disabled={app.locked}
          key={id}
          label={id}
          name={id}
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
