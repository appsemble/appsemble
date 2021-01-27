import {
  Content,
  FormButtons,
  PasswordField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
} from '@appsemble/react-components';
import axios, { AxiosError } from 'axios';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { HelmetIntl } from '../HelmetIntl';
import { useUser } from '../UserProvider';
import { messages } from './messages';

interface RegistrationFormValues {
  email: string;
  name: string;
  password: string;
}

export function Register(): ReactElement {
  const { login } = useUser();
  const register = useCallback(
    async (values: RegistrationFormValues) => {
      const { data } = await axios.post('/api/email', values);
      login(data);
    },
    [login],
  );

  return (
    <Content padding>
      <HelmetIntl title={messages.title} />
      <SimpleForm defaultValues={{ email: '', name: '', password: '' }} onSubmit={register}>
        <SimpleFormError>
          {({ error }: { error: AxiosError }) =>
            error.response && error.response.status === 409 ? (
              <FormattedMessage {...messages.emailConflict} />
            ) : (
              <FormattedMessage {...messages.registerFailed} />
            )
          }
        </SimpleFormError>
        <SimpleFormField
          autoComplete="name"
          help={<FormattedMessage {...messages.nameHelp} />}
          icon="user"
          label={<FormattedMessage {...messages.nameLabel} />}
          name="name"
        />
        <SimpleFormField
          autoComplete="email"
          icon="envelope"
          label={<FormattedMessage {...messages.emailLabel} />}
          name="email"
          required
          type="email"
          validityMessages={{
            typeMismatch: <FormattedMessage {...messages.emailInvalid} />,
            valueMissing: <FormattedMessage {...messages.emailRequired} />,
          }}
        />
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
            <FormattedMessage {...messages.registerButton} />
          </SimpleSubmit>
        </FormButtons>
      </SimpleForm>
    </Content>
  );
}
