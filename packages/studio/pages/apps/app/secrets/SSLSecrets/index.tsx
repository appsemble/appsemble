import {
  Button,
  Message,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  TextAreaField,
  useData,
  useMessages,
} from '@appsemble/react-components';
import axios from 'axios';
import { type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages.js';
import { AsyncDataView } from '../../../../../components/AsyncDataView/index.js';
import { useApp } from '../../index.js';

const certPlaceholder = `-----BEGIN CERTIFICATE-----

-----END CERTIFICATE-----`;
const keyPlaceholder = `-----BEGIN PRIVATE KEY-----

-----END PRIVATE KEY-----`;

interface SSLSecret {
  certificate: string;
  key: string;
}

export function SSLSecrets(): ReactNode {
  const { app } = useApp();
  const push = useMessages();
  const { formatMessage } = useIntl();

  const url = `/api/apps/${app.id}/secrets/ssl`;

  const result = useData<SSLSecret>(url);

  const onSubmit = async (values: SSLSecret): Promise<void> => {
    const { data } = await axios.put(url, values);
    push({ body: formatMessage(messages.submitSuccess), color: 'success' });
    result.setData(data);
  };

  return (
    <AsyncDataView
      errorMessage={<FormattedMessage {...messages.loadingError} />}
      loadingMessage={<FormattedMessage {...messages.loadingMessage} />}
      result={result}
    >
      {(secret) => (
        <SimpleForm defaultValues={secret} onSubmit={onSubmit}>
          {app.domain ? null : (
            <Message color="warning">
              <FormattedMessage {...messages.prequisiteWarning} />
            </Message>
          )}
          <SimpleFormError>{() => <FormattedMessage {...messages.submitError} />}</SimpleFormError>
          <SimpleFormField
            component={TextAreaField}
            help={<FormattedMessage {...messages.certHelp} />}
            label={<FormattedMessage {...messages.certLabel} />}
            name="certificate"
            placeholder={certPlaceholder}
          />
          <SimpleFormField
            component={TextAreaField}
            help={<FormattedMessage {...messages.keyHelp} />}
            label={<FormattedMessage {...messages.keyLabel} />}
            name="key"
            placeholder={keyPlaceholder}
          />
          <Button color="primary" type="submit">
            <FormattedMessage {...messages.submit} />
          </Button>
        </SimpleForm>
      )}
    </AsyncDataView>
  );
}
