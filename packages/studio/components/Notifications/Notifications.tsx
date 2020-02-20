import { SimpleForm, SimpleInput, SimpleSubmit, useMessages } from '@appsemble/react-components';
import axios from 'axios';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import useApp from '../../hooks/useApp';
import HelmetIntl from '../HelmetIntl';
import messages from './messages';

export default function Notifications(): React.ReactElement {
  const intl = useIntl();
  const push = useMessages();
  const { app } = useApp();
  const submit = React.useCallback(
    async ({ body, title }: { title: string; body: string }): Promise<void> => {
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
