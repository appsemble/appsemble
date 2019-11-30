import { SimpleForm, SimpleInput, SimpleSubmit } from '@appsemble/react-components';
import { App, Message } from '@appsemble/types';
import axios from 'axios';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, RouteComponentProps } from 'react-router-dom';

import HelmetIntl from '../HelmetIntl';
import messages from './messages';

export interface NotificationsProps extends RouteComponentProps<{ id: string }> {
  app: App;
  push: (message: Message) => void;
}

export default function Notifications({ app, push }: NotificationsProps): React.ReactElement {
  const intl = useIntl();

  const submit = React.useCallback(
    async ({ title, body }: { title: string; body: string }): Promise<void> => {
      try {
        await axios.post(`/api/apps/${app.id}/broadcast`, { title, body });
        push({ body: intl.formatMessage(messages.submitSuccess), color: 'success' });
      } catch (error) {
        push({ body: intl.formatMessage(messages.submitError), color: 'danger' });
      }
    },
    [app.id, intl, push],
  );

  const { notifications } = app.definition;
  const disabled = notifications === undefined;

  return (
    <>
      <HelmetIntl title={messages.title} />

      <div className="content">
        {disabled && (
          <p>
            <FormattedMessage
              {...messages.enableInstructions}
              values={{
                appDefinition: (
                  <Link to={`/apps/${app.id}/edit#editor`}>
                    <FormattedMessage {...messages.appDefinition} />
                  </Link>
                ),
                navigation: (
                  <a
                    href="https://appsemble.dev/reference/app#notification"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <code>notifications</code>
                  </a>
                ),
              }}
            />
          </p>
        )}

        <SimpleForm defaultValues={{ title: '', body: '' }} onSubmit={submit} resetOnSuccess>
          <SimpleInput
            disabled={disabled}
            label={<FormattedMessage {...messages.titleLabel} />}
            name="title"
            required
            type="text"
          />
          <SimpleInput
            disabled={disabled}
            label={<FormattedMessage {...messages.bodyLabel} />}
            name="body"
            required
            type="text"
          />
          <SimpleSubmit disabled={disabled}>
            <FormattedMessage {...messages.requestButton} />
          </SimpleSubmit>
        </SimpleForm>
      </div>
    </>
  );
}
