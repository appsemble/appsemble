import { SimpleForm, SimpleInput, SimpleSubmit } from '@appsemble/react-components';
import { App, Message } from '@appsemble/types';
import axios from 'axios';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { push } from '../../actions/message';
import HelmetIntl from '../HelmetIntl';
import messages from './messages';
import styles from './Notifications.css';

export interface NotificationsProps {
  app: App;
  push: (message: Message) => void;
}

export default function Notifications({ app }: NotificationsProps): React.ReactElement {
  const intl = useIntl();

  const submit = async ({ title, body }: { title: string; body: string }): Promise<void> => {
    try {
      await axios.post(`/api/apps/${app.id}/broadcast`, { title, body });
      push({ body: intl.formatMessage(messages.submitSuccess), color: 'danger' });
    } catch (error) {
      push({ body: intl.formatMessage(messages.submitError), color: 'danger' });
    }
  };

  return (
    <>
      <HelmetIntl title={messages.title} />

      <SimpleForm
        className={styles.root}
        defaultValues={{ title: '', body: '' }}
        onSubmit={submit}
        resetOnSuccess
      >
        <SimpleInput
          label={<FormattedMessage {...messages.titleLabel} />}
          name="title"
          required
          type="text"
        />
        <SimpleInput
          label={<FormattedMessage {...messages.bodyLabel} />}
          name="body"
          required
          type="text"
        />
        <SimpleSubmit>
          <FormattedMessage {...messages.requestButton} />
        </SimpleSubmit>
      </SimpleForm>
    </>
  );
}
