import {
  Content,
  PasswordField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
} from '@appsemble/react-components';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { useUser } from '../UserProvider';
import { messages } from './messages';

export function EmailLogin(): ReactElement {
  const { passwordLogin } = useUser();

  return (
    <Content main padding>
      <SimpleForm defaultValues={{ username: '', password: '' }} onSubmit={passwordLogin}>
        <SimpleFormError>{() => <FormattedMessage {...messages.loginFailed} />}</SimpleFormError>
        <SimpleFormField
          autoComplete="email"
          icon="envelope"
          label={<FormattedMessage {...messages.usernameLabel} />}
          name="username"
          required
          type="email"
        />
        <SimpleFormField
          autoComplete="current-password"
          component={PasswordField}
          label={<FormattedMessage {...messages.passwordLabel} />}
          name="password"
          required
        />
        <SimpleSubmit className="is-pulled-right">
          <FormattedMessage {...messages.loginButton} />
        </SimpleSubmit>
      </SimpleForm>
    </Content>
  );
}
