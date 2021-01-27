import {
  Content,
  FormButtons,
  Message,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
} from '@appsemble/react-components';
import axios from 'axios';
import { ReactElement, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { HelmetIntl } from '../HelmetIntl';
import { messages } from './messages';

interface FormValues {
  email: string;
}

export function ResetPassword(): ReactElement {
  const [success, setSuccess] = useState(false);

  const submit = useCallback(async ({ email }: FormValues): Promise<void> => {
    await axios.post('/api/email/reset/request', { email });
    setSuccess(true);
  }, []);

  return (
    <Content padding>
      <HelmetIntl title={messages.title} />
      {success ? (
        <Message color="success">
          <FormattedMessage {...messages.requestSuccess} />
        </Message>
      ) : (
        <SimpleForm defaultValues={{ email: '' }} onSubmit={submit} resetOnSuccess>
          <SimpleFormError>
            {() => <FormattedMessage {...messages.requestFailed} />}
          </SimpleFormError>
          <SimpleFormField
            autoComplete="email"
            icon="envelope"
            label={<FormattedMessage {...messages.emailLabel} />}
            name="email"
            required
            type="email"
            validityMessages={{
              valueMissing: <FormattedMessage {...messages.emailRequired} />,
              typeMismatch: <FormattedMessage {...messages.emailMissing} />,
            }}
          />
          <FormButtons>
            <SimpleSubmit className="is-pulled-right">
              <FormattedMessage {...messages.requestButton} />
            </SimpleSubmit>
          </FormButtons>
        </SimpleForm>
      )}
    </Content>
  );
}
