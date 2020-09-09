import {
  Content,
  FormButtons,
  Message,
  PasswordField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  useQuery,
} from '@appsemble/react-components';
import axios from 'axios';
import React, { ReactElement, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { HelmetIntl } from '../HelmetIntl';
import { messages } from './messages';

export function EditPassword(): ReactElement {
  const qs = useQuery();
  const [success, setSuccess] = useState(false);
  const token = qs.get('token');
  const submit = useCallback(
    async ({ password }) => {
      await axios.post('/api/email/reset', { token, password });
      setSuccess(true);
    },
    [token],
  );

  if (!token) {
    return <Redirect to="/apps" />;
  }

  return (
    <Content padding>
      <HelmetIntl title={messages.title} />
      {success ? (
        <Message color="success">
          <FormattedMessage {...messages.requestSuccess} />
        </Message>
      ) : (
        <SimpleForm defaultValues={{ password: '' }} onSubmit={submit}>
          <SimpleFormError>
            {() => <FormattedMessage {...messages.requestFailed} />}
          </SimpleFormError>
          <SimpleFormField
            autoComplete="new-password"
            component={PasswordField}
            label={<FormattedMessage {...messages.passwordLabel} />}
            name="password"
            required
            validityMessages={{
              valueMissing: <FormattedMessage {...messages.passwordRequired} />,
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
