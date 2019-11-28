import {
  PasswordInput,
  SimpleForm,
  SimpleFormError,
  SimpleInput,
  SimpleSubmit,
} from '@appsemble/react-components';
import { AxiosError } from 'axios';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import HelmetIntl from '../HelmetIntl';
import messages from './messages';
import styles from './Register.css';

interface RegistrationFormValues {
  email: string;
  password: string;
}

interface RegisterProps {
  registerEmail: (email: string, password: string) => Promise<void>;
  passwordLogin: (
    url: string,
    { username, password }: { username: string; password: string },
    refreshURL: string,
    clientId: string,
    scope: string,
  ) => Promise<void>;
}

export default function Register({
  passwordLogin,
  registerEmail,
}: RegisterProps): React.ReactElement {
  const register = React.useCallback(
    async ({ email, password }: RegistrationFormValues) => {
      await registerEmail(email, password);
      await passwordLogin(
        '/api/oauth/token',
        { username: email, password },
        '/api/oauth/token',
        'appsemble-studio',
        'apps:read apps:write',
      );
    },
    [passwordLogin, registerEmail],
  );

  return (
    <SimpleForm
      className={styles.root}
      defaultValues={{ email: '', password: '' }}
      onSubmit={register}
    >
      <HelmetIntl title={messages.title} />
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
      <SimpleSubmit className="is-pulled-right">
        <FormattedMessage {...messages.registerButton} />
      </SimpleSubmit>
    </SimpleForm>
  );
}
