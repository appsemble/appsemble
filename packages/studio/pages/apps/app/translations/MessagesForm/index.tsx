import {
  FormButtons,
  SimpleBeforeUnload,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleFormObject,
  SimpleSubmit,
  TextAreaField,
  useMessages,
} from '@appsemble/react-components';
import { type AppMessages, type AppsembleMessages } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { Collapsible } from '../../../../../components/Collapsible/index.js';
import { useApp } from '../../index.js';

interface MessagesFormProps {
  /**
   * The language ID to eit messages for.
   */
  readonly languageId: string;

  /**
   * The old app messages.
   */
  readonly appMessages: AppMessages;

  /**
   * The default app messages without any modifications by the app.
   */
  readonly defaultAppMessages: AppMessages;
}

/**
 * Render a form for editing app messages.
 */
export function MessagesForm({
  appMessages,
  defaultAppMessages,
  languageId,
}: MessagesFormProps): ReactNode {
  const { app } = useApp();
  const push = useMessages();
  const { formatMessage } = useIntl();

  const onSubmit = useCallback(
    async (values: AppsembleMessages) => {
      await axios.post(`/api/apps/${app.id}/messages`, {
        language: languageId,
        messages: values,
      });
      push({ color: 'success', body: formatMessage(messages.uploadSuccess) });
    },
    [app, formatMessage, push, languageId],
  );

  const defaultValues: AppsembleMessages = useMemo(() => {
    const blocks = { ...appMessages.messages.blocks };
    for (const blockId of Object.keys(blocks)) {
      for (const version of Object.keys(blocks[blockId])) {
        for (const messageId of Object.keys(blocks[blockId][version])) {
          if (
            defaultAppMessages.messages.blocks[blockId][version]?.[messageId] ===
            appMessages.messages.blocks[blockId][version][messageId]
          ) {
            blocks[blockId][version][messageId] = '';
          }
        }
      }
    }
    return {
      app: Object.fromEntries(
        Object.entries(appMessages.messages.app ?? {}).map(([key, value]) => [
          key,
          defaultAppMessages.messages.app[key] === value ? '' : value,
        ]),
      ),
      core: Object.fromEntries(
        Object.entries(appMessages.messages.core ?? {}).map(([key, value]) => [
          key,
          defaultAppMessages.messages.core[key] === value ? '' : value,
        ]),
      ),
      blocks,
      messageIds: appMessages.messages.messageIds,
    };
  }, [appMessages, defaultAppMessages]);

  const sortedMessageIds = useMemo(
    () =>
      Object.entries(defaultAppMessages.messages.messageIds ?? {}).sort(([idA], [idB]) =>
        idA.localeCompare(idB),
      ),
    [defaultAppMessages],
  );

  return (
    <SimpleForm defaultValues={defaultValues} onSubmit={onSubmit}>
      <SimpleFormError>{() => <FormattedMessage {...messages.uploadError} />}</SimpleFormError>
      <SimpleBeforeUnload />
      {Object.keys(defaultAppMessages.messages.messageIds).length ? (
        <Collapsible size={5} title={<FormattedMessage {...messages.messageIds} />}>
          <SimpleFormObject name="messageIds">
            {sortedMessageIds.map(([id, defaultMessage]) => (
              <SimpleFormField
                component={TextAreaField}
                disabled={app.locked !== 'unlocked'}
                key={id}
                label={id}
                name={id}
                placeholder={defaultMessage}
                rows={2}
              />
            ))}
          </SimpleFormObject>
        </Collapsible>
      ) : null}
      <Collapsible size={5} title={<FormattedMessage {...messages.app} />}>
        <SimpleFormObject name="app">
          {Object.entries(defaultAppMessages.messages.app).map(([id, defaultMessage]) => (
            <SimpleFormField
              component={TextAreaField}
              disabled={app.locked !== 'unlocked'}
              key={id}
              label={id}
              name={id}
              placeholder={defaultMessage}
              rows={2}
            />
          ))}
        </SimpleFormObject>
      </Collapsible>
      <Collapsible size={5} title={<FormattedMessage {...messages.block} />}>
        <SimpleFormObject name="blocks">
          {Object.entries(defaultAppMessages.messages.blocks).map(([blockId, blockVersions]) => (
            <SimpleFormObject key={blockId} name={blockId}>
              {Object.entries(blockVersions).map(([version, message]) => (
                <SimpleFormObject key={version} name={version}>
                  {Object.entries(message).map(([messageId, defaultMessage]) => (
                    <SimpleFormField
                      component={TextAreaField}
                      disabled={app.locked !== 'unlocked'}
                      key={`${blockId}.${version}.${messageId}`}
                      label={`${blockId}/${version}/${messageId}`}
                      name={messageId}
                      placeholder={defaultMessage}
                      rows={2}
                    />
                  ))}
                </SimpleFormObject>
              ))}
            </SimpleFormObject>
          ))}
        </SimpleFormObject>
      </Collapsible>
      <Collapsible collapsed size={5} title={<FormattedMessage {...messages.core} />}>
        <SimpleFormObject name="core">
          {Object.entries(defaultAppMessages.messages.core).map(([id, defaultMessage]) => (
            <SimpleFormField
              component={TextAreaField}
              disabled={app.locked !== 'unlocked'}
              key={id}
              label={id}
              name={id}
              placeholder={defaultMessage}
              rows={2}
            />
          ))}
        </SimpleFormObject>
      </Collapsible>
      <FormButtons>
        <SimpleSubmit
          className={`${styles.submitButton} mb-4`}
          disabled={app.locked !== 'unlocked'}
        >
          <FormattedMessage {...messages.submit} />
        </SimpleSubmit>
      </FormButtons>
    </SimpleForm>
  );
}
