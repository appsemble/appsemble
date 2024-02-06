import {
  Content,
  FormButtons,
  SimpleForm,
  SimpleFormField,
  SimpleSubmit,
  Title,
  useMessages,
  useMeta,
} from '@appsemble/react-components';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { useApp } from '../index.js';

export function NotificationsPage(): ReactNode {
  useMeta(messages.title);

  const { app } = useApp();
  const { lang } = useParams<{ lang: string }>();

  const { formatMessage } = useIntl();
  const push = useMessages();
  const submit = useCallback(
    async ({ body, title }: { title: string; body: string }): Promise<void> => {
      try {
        await axios.post(`/api/apps/${app.id}/broadcast`, { title, body });
        push({ body: formatMessage(messages.submitSuccess), color: 'success' });
      } catch {
        push({ body: formatMessage(messages.submitError), color: 'danger' });
      }
    },
    [app.id, formatMessage, push],
  );

  const { notifications } = app.definition;
  const disabled = notifications === undefined;

  return (
    <Content>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <div className="content">
        {disabled ? (
          <p>
            <FormattedMessage
              {...messages.enableInstructions}
              values={{
                link: (link) => <Link to={`/${lang}/apps/${app.id}/edit#editor`}>{link}</Link>,
                navigation: (
                  <Link
                    rel="noopener noreferrer"
                    target="_blank"
                    to={`/${lang}/docs/reference/app#notification`}
                  >
                    <code>notifications</code>
                  </Link>
                ),
              }}
            />
          </p>
        ) : null}

        <SimpleForm defaultValues={{ title: '', body: '' }} onSubmit={submit} resetOnSuccess>
          <SimpleFormField
            disabled={disabled}
            label={<FormattedMessage {...messages.titleLabel} />}
            maxLength={30}
            name="title"
            required
          />
          <SimpleFormField
            disabled={disabled}
            label={<FormattedMessage {...messages.bodyLabel} />}
            maxLength={100}
            name="body"
            required
          />
          <FormButtons>
            <SimpleSubmit disabled={disabled}>
              <FormattedMessage {...messages.requestButton} />
            </SimpleSubmit>
          </FormButtons>
        </SimpleForm>
      </div>
    </Content>
  );
}
