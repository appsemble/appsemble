import {
  Content,
  FormButtons,
  PasswordInput,
  SimpleForm,
  SimpleFormError,
  SimpleInput,
  SimpleSubmit,
} from '@appsemble/react-components';
import axios, { AxiosError } from 'axios';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import useUser from '../../hooks/useUser';
import HelmetIntl from '../HelmetIntl';
import messages from './messages';

interface RegistrationFormValues {
  email: string;
  password: string;
}

export default function Register(): React.ReactElement {
  const { login } = useUser();
  const register = React.useCallback(
    async ({ email, password }: RegistrationFormValues) => {
      const { data } = await axios.post('/api/email', { email, password });
      login(data);
    },
    [login],
  );

  return (
    <Content pad>
      <HelmetIntl title={messages.title} />
      <SimpleForm defaultValues={{ email: '', password: '' }} onSubmit={register}>
        <SimpleFormError>
          {({ error }: { error: AxiosError }) =>
            error.response && error.response.status === 409 ? (
              <FormattedMessage {...messages.emailConflict} />
            ) : (
              <FormattedMessage {...messages.registerFailed} />
            )
          }
        </SimpleFormError>
        <SimpleInput
          autoComplete="email"
          iconLeft="envelope"
          label={<FormattedMessage {...messages.emailLabel} />}
          name="email"
          required
          type="email"
          validityMessages={{
            typeMismatch: <FormattedMessage {...messages.emailInvalid} />,
            valueMissing: <FormattedMessage {...messages.emailRequired} />,
          }}
        />
        <SimpleInput
          autoComplete="new-password"
          component={PasswordInput}
          label={<FormattedMessage {...messages.passwordLabel} />}
          name="password"
          required
          validityMessages={{
            valueMissing: <FormattedMessage {...messages.passwordRequired} />,
          }}
        />
        <FormButtons>
          <SimpleSubmit className="is-pulled-right">
            <FormattedMessage {...messages.registerButton} />
          </SimpleSubmit>
        </FormButtons>
      </SimpleForm>
    </Content>
  );
}
