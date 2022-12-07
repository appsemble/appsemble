import {
  Button,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  TextAreaField,
  useData,
} from '@appsemble/react-components';
import axios from 'axios';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { AsyncDataView } from '../../../../../components/AsyncDataView/index.js';
import { useApp } from '../../index.js';
import { messages } from './messages.js';

const certPlaceholder = `-----BEGIN CERTIFICATE-----

-----END CERTIFICATE-----`;
const keyPlaceholder = `-----BEGIN PRIVATE KEY-----

-----END PRIVATE KEY-----`;

interface SSLSecret {
  certificate: string;
  key: string;
}

export function SSLSecrets(): ReactElement {
  const {
    app: { id },
  } = useApp();

  const url = `/api/apps/${id}/secrets/ssl`;

  const result = useData<SSLSecret>(url);

  const onSubmit = async (values: SSLSecret): Promise<void> => {
    const { data } = await axios.put(url, values);
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
